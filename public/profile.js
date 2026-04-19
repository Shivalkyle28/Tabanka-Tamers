/* =========================
   1. GAMIFICATION ENGINE
========================= */
const GAMIFICATION_CONFIG = {
  LEVEL_BASE_XP: 100,
  EXPONENT: 1.5,
  RANKS: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]
};

export const GamificationService = {
  calculateLevel(totalXp = 0) {
    if (totalXp < GAMIFICATION_CONFIG.LEVEL_BASE_XP) return 1;
    return (
      Math.floor(
        Math.pow(
          totalXp / GAMIFICATION_CONFIG.LEVEL_BASE_XP,
          1 / GAMIFICATION_CONFIG.EXPONENT
        )
      ) + 1
    );
  },

  getTieredRank(totalLevel) {
    const levelsPerRank = 3;
    const rankIndex = Math.min(
      Math.floor((totalLevel - 1) / levelsPerRank),
      GAMIFICATION_CONFIG.RANKS.length - 1
    );
    const subLevel = ((totalLevel - 1) % levelsPerRank) + 1;
    return `${GAMIFICATION_CONFIG.RANKS[rankIndex]} ${subLevel}`;
  },

  getXpThreshold(level) {
    return Math.floor(
      GAMIFICATION_CONFIG.LEVEL_BASE_XP *
        Math.pow(level, GAMIFICATION_CONFIG.EXPONENT)
    );
  }
};

/* =========================
   2. DOM REFERENCES
========================= */
const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");
const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");
const accountMessage = document.getElementById("accountMessage");

const notificationsToggle = document.getElementById("notificationsToggle");
const themePreference = document.getElementById("themePreference");

const avatarInitial = document.getElementById("avatarInitial");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const photoInput = document.getElementById("photoInput");
const avatarPreview = document.getElementById("avatarPreview");

/* =========================
   3. USER / STORAGE HELPERS
========================= */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getProfileKey() {
  const user = getCurrentUser();
  return user ? `profile_${user.username}` : null;
}

function getPreferencesKey() {
  const user = getCurrentUser();
  return user ? `preferences_${user.username}` : null;
}

function protectPage() {
  if (!getCurrentUser()) {
    alert("You must be logged in to view this page.");
    window.location.href = "auth.html";
  }
}

function updateUserStatus() {
  const user = getCurrentUser();

  if (user && userStatus) {
    userStatus.textContent = user.username;
    userStatus.classList.add("clickable-user");
    userStatus.onclick = () => {
      window.location.href = "profile.html";
    };
  } else if (userStatus) {
    userStatus.textContent = "Guest";
    userStatus.classList.remove("clickable-user");
    userStatus.onclick = null;
  }
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
}

/* =========================
   4. THEME LOGIC
========================= */
function applyTheme(theme) {
  document.body.classList.remove("light-mode");

  if (theme === "light") {
    document.body.classList.add("light-mode");
  }
}

function loadTheme() {
  const key = getPreferencesKey();
  if (!key) return;

  const preferences = JSON.parse(localStorage.getItem(key)) || {};
  const savedTheme = preferences.theme || "dark";

  applyTheme(savedTheme);

  if (themePreference) {
    themePreference.value = savedTheme;
  }
}

function saveTheme() {
  const key = getPreferencesKey();
  if (!key || !themePreference) return;

  const preferences = JSON.parse(localStorage.getItem(key)) || {};
  preferences.theme = themePreference.value || "dark";

  localStorage.setItem(key, JSON.stringify(preferences));
  applyTheme(preferences.theme);
}

/* =========================
   5. PROFILE LOAD / SAVE
========================= */
function loadProfile() {
  const key = getProfileKey();
  if (!key) {
    console.warn("No user logged in. Sync aborted.");
    return;
  }

  const savedData = JSON.parse(localStorage.getItem(key)) || {};
  const currentUser = getCurrentUser();

  const nameInput = document.getElementById("profileName");
  const emailInput = document.getElementById("profileEmail");
  const currentWeightInput = document.getElementById("currentWeight");
  const goalWeightInput = document.getElementById("goalWeight");
  const fitnessGoalInput = document.getElementById("fitnessGoal");

  if (nameInput) nameInput.value = savedData.name || currentUser?.username || "";
  if (emailInput) emailInput.value = savedData.email || "";
  if (currentWeightInput) currentWeightInput.value = savedData.currentWeight || "";
  if (goalWeightInput) goalWeightInput.value = savedData.goalWeight || "";
  if (fitnessGoalInput) fitnessGoalInput.value = savedData.fitnessGoal || "";

  if (notificationsToggle) {
    notificationsToggle.checked = !!savedData.notificationsEnabled;
  }

  if (avatarInitial) {
    const sourceName = savedData.name || currentUser?.username || "U";
    avatarInitial.textContent = sourceName.charAt(0).toUpperCase();
  }

  if (savedData.avatarDataUrl && avatarPreview) {
    avatarPreview.style.backgroundImage = `url(${savedData.avatarDataUrl})`;
    avatarPreview.style.backgroundSize = "cover";
    avatarPreview.style.backgroundPosition = "center";
    if (avatarInitial) avatarInitial.style.opacity = "0";
  } else if (avatarPreview) {
    avatarPreview.style.backgroundImage = "";
    if (avatarInitial) avatarInitial.style.opacity = "1";
  }

  const xp = savedData.totalXp || 0;
  const totalLevel = GamificationService.calculateLevel(xp);
  const tieredRank = GamificationService.getTieredRank(totalLevel);
  const nextThreshold = GamificationService.getXpThreshold(totalLevel);
  const prevThreshold =
    totalLevel === 1 ? 0 : GamificationService.getXpThreshold(totalLevel - 1);

  const rankDisplay = document.getElementById("user-rank");
  const xpTextDisplay = document.getElementById("profile-xp-text");
  const progressBar = document.getElementById("profile-xp-progress");

  if (rankDisplay) rankDisplay.textContent = tieredRank;
  if (xpTextDisplay) xpTextDisplay.textContent = `${xp} / ${nextThreshold} XP`;

  if (progressBar) {
    const range = nextThreshold - prevThreshold;
    const percent = range > 0 ? ((xp - prevThreshold) / range) * 100 : 0;
    progressBar.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
  }

  renderAchievements(totalLevel);
}

function saveProfile(event) {
  event.preventDefault();

  const key = getProfileKey();
  if (!key) {
    console.warn("No user logged in.");
    return;
  }

  const existing = JSON.parse(localStorage.getItem(key)) || {};

  const data = {
    ...existing,
    name: document.getElementById("profileName")?.value.trim() || "",
    email: document.getElementById("profileEmail")?.value.trim() || "",
    currentWeight: document.getElementById("currentWeight")?.value || "",
    goalWeight: document.getElementById("goalWeight")?.value || "",
    fitnessGoal: document.getElementById("fitnessGoal")?.value || "",
    notificationsEnabled: notificationsToggle ? notificationsToggle.checked : false,
    totalXp: existing.totalXp || 0
  };

  localStorage.setItem(key, JSON.stringify(data));

  if (profileMessage) {
    profileMessage.textContent = "Profile updated!";
  }

  loadProfile();
}

window.saveProfile = saveProfile;

/* =========================
   6. ACHIEVEMENTS
========================= */
function renderAchievements(totalLevel) {
  const container = document.getElementById("achievements-container");
  if (!container) return;

  const tiers = [
    { name: "Bronze Tamer", icon: "🥉" },
    { name: "Silver Warrior", icon: "🥈" },
    { name: "Gold Elite", icon: "🥇" },
    { name: "Platinum Legend", icon: "🏆" },
    { name: "Diamond Titan", icon: "💎" }
  ];

  const currentTierIndex = Math.min(
    Math.floor((totalLevel - 1) / 3),
    tiers.length - 1
  );
  const currentTier = tiers[currentTierIndex];
  const nextTier = tiers[currentTierIndex + 1];

  let html = `
    <div class="achievement-card earned">
      <div class="ach-icon">${currentTier.icon}</div>
      <div class="ach-info">
        <h4>Current Status: ${currentTier.name}</h4>
        <p>You are dominating the ${currentTier.name.split(" ")[0]} ranks.</p>
      </div>
    </div>
  `;

  if (nextTier) {
    html += `
      <div class="achievement-card locked">
        <div class="ach-icon">🔒</div>
        <div class="ach-info">
          <h4>Next Milestone: ${nextTier.name}</h4>
          <p>Keep training to unlock ${nextTier.name} status.</p>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/* =========================
   7. AVATAR UPLOAD
========================= */
function handlePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const key = getProfileKey();
  if (!key) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const existing = JSON.parse(localStorage.getItem(key)) || {};
    existing.avatarDataUrl = e.target.result;
    localStorage.setItem(key, JSON.stringify(existing));
    loadProfile();
  };
  reader.readAsDataURL(file);
}

/* =========================
   8. ACCOUNT ACTION PLACEHOLDERS
========================= */
function showAccountMessage(message) {
  if (accountMessage) {
    accountMessage.textContent = message;
  }
}

/* =========================
   9. EVENT BINDING
========================= */
document.addEventListener("DOMContentLoaded", () => {
  protectPage();
  updateUserStatus();
  loadTheme();
  loadProfile();

  if (profileForm) {
    profileForm.addEventListener("submit", saveProfile);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }

  if (themePreference) {
    themePreference.addEventListener("change", saveTheme);
  }

  if (notificationsToggle) {
    notificationsToggle.addEventListener("change", () => {
      const key = getProfileKey();
      if (!key) return;
      const existing = JSON.parse(localStorage.getItem(key)) || {};
      existing.notificationsEnabled = notificationsToggle.checked;
      localStorage.setItem(key, JSON.stringify(existing));
    });
  }

  if (uploadPhotoBtn && photoInput) {
    uploadPhotoBtn.addEventListener("click", () => photoInput.click());
    photoInput.addEventListener("change", handlePhotoUpload);
  }

  document.getElementById("installAppBtn")?.addEventListener("click", () => {
    showAccountMessage("Install prompt is not connected yet.");
  });

  document.getElementById("changePasswordBtn")?.addEventListener("click", () => {
    showAccountMessage("Change password is not connected yet.");
  });

  document.getElementById("exportDataBtn")?.addEventListener("click", () => {
    showAccountMessage("Export data is not connected yet.");
  });

  document.getElementById("deleteAccountBtn")?.addEventListener("click", () => {
    showAccountMessage("Delete account is not connected yet.");
  });
});