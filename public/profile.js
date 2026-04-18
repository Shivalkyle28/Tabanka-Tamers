/* =========================
   1. GAMIFICATION ENGINE
========================= */
const GAMIFICATION_CONFIG = {
  LEVEL_BASE_XP: 100,
  EXPONENT: 1.5,
  RANKS: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
};

export const GamificationService = {
  calculateLevel(totalXp = 0) {
    if (totalXp < GAMIFICATION_CONFIG.LEVEL_BASE_XP) return 1;
    return Math.floor(Math.pow(totalXp / GAMIFICATION_CONFIG.LEVEL_BASE_XP, 1 / GAMIFICATION_CONFIG.EXPONENT)) + 1;
  },
  getTieredRank(totalLevel) {
    const levelsPerRank = 3; 
    const rankIndex = Math.min(Math.floor((totalLevel - 1) / levelsPerRank), GAMIFICATION_CONFIG.RANKS.length - 1);
    const subLevel = ((totalLevel - 1) % levelsPerRank) + 1;
    return `${GAMIFICATION_CONFIG.RANKS[rankIndex]} ${subLevel}`;
  },
  getXpThreshold(level) {
    return Math.floor(GAMIFICATION_CONFIG.LEVEL_BASE_XP * Math.pow(level, GAMIFICATION_CONFIG.EXPONENT));
  }
};

/* =========================
   2. DATA ACCESSORS
========================= */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getProfileKey() {
  const user = getCurrentUser();
  // CRITICAL: This MUST match the key used in workouts.js exactly
  return user ? `profile_${user.username}` : null;
}

/* =========================
   3. UI SYNC LOGIC
========================= */
function loadProfile() {
  const key = getProfileKey();
  if (!key) {
    console.warn("No user logged in. Sync aborted.");
    return;
  }

  const savedData = JSON.parse(localStorage.getItem(key)) || {};
  const currentUser = getCurrentUser();

  // 1. Sync Profile Text Fields
  const nameInput = document.getElementById("profileName");
  const emailInput = document.getElementById("profileEmail");
  if(nameInput) nameInput.value = savedData.name || currentUser?.username || "";
  if(emailInput) emailInput.value = savedData.email || "";

  // 2. Sync Gamification (XP)
  const xp = savedData.totalXp || 0;
  const totalLevel = GamificationService.calculateLevel(xp);
  const tieredRank = GamificationService.getTieredRank(totalLevel);
  const nextThreshold = GamificationService.getXpThreshold(totalLevel);
  const prevThreshold = totalLevel === 1 ? 0 : GamificationService.getXpThreshold(totalLevel - 1);

  // 3. Update HTML Elements
  const rankDisplay = document.getElementById("user-rank");
  const xpTextDisplay = document.getElementById("profile-xp-text");
  const progressBar = document.getElementById("profile-xp-progress");

  if (rankDisplay) rankDisplay.textContent = tieredRank;
  if (xpTextDisplay) xpTextDisplay.textContent = `${xp} / ${nextThreshold} XP`;
  if (progressBar) {
    const percent = ((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
    progressBar.style.width = `${Math.min(percent, 100)}%`;
  }

  renderAchievements(totalLevel);
}

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

  // Calculate current and next tier based on our 3-level system
  const currentTierIndex = Math.min(Math.floor((totalLevel - 1) / 3), tiers.length - 1);
  const currentTier = tiers[currentTierIndex];
  const nextTier = tiers[currentTierIndex + 1];

  let html = `
    <div class="achievement-card earned">
      <div class="ach-icon">${currentTier.icon}</div>
      <div class="ach-info">
        <h4>Current Status: ${currentTier.name}</h4>
        <p>You are dominating the ${currentTier.name.split(' ')[0]} ranks.</p>
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
   4. INITIALIZATION (The Module Fix)
========================= */
loadProfile();

// Re-expose saveProfile for the form
window.saveProfile = function(event) {
  event.preventDefault();
  const key = getProfileKey();
  const existing = JSON.parse(localStorage.getItem(key)) || {};
  
  const data = {
    ...existing,
    name: document.getElementById("profileName").value.trim(),
    email: document.getElementById("profileEmail").value.trim(),
    currentWeight: document.getElementById("currentWeight").value,
    goalWeight: document.getElementById("goalWeight").value,
    fitnessGoal: document.getElementById("fitnessGoal").value,
    // Keep the XP intact!
    totalXp: existing.totalXp || 0 
  };

  localStorage.setItem(key, JSON.stringify(data));
  document.getElementById("profileMessage").textContent = "Profile updated!";
  loadProfile();
};