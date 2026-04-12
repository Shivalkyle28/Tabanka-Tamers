const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

const profileForm = document.getElementById("profileForm");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const currentWeight = document.getElementById("currentWeight");
const goalWeight = document.getElementById("goalWeight");
const fitnessGoal = document.getElementById("fitnessGoal");
const profileMessage = document.getElementById("profileMessage");

const notificationsToggle = document.getElementById("notificationsToggle");
const themePreference = document.getElementById("themePreference");

const avatarPreview = document.getElementById("avatarPreview");
const avatarInitial = document.getElementById("avatarInitial");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const photoInput = document.getElementById("photoInput");

const installAppBtn = document.getElementById("installAppBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const exportDataBtn = document.getElementById("exportDataBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const accountMessage = document.getElementById("accountMessage");

let deferredPrompt = null;

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
    alert("You must be logged in.");
    window.location.href = "auth.html";
  }
}

function updateUserStatus() {
  const user = getCurrentUser();

  if (user) {
    userStatus.textContent = user.username;
    userStatus.classList.add("clickable-user");
    userStatus.onclick = function () {
      window.location.href = "profile.html";
    };
  } else {
    userStatus.textContent = "Guest";
    userStatus.classList.remove("clickable-user");
    userStatus.onclick = null;
  }
}

function applyTheme(theme) {
  document.body.classList.remove("light-mode");

  if (theme === "light") {
    document.body.classList.add("light-mode");
  }
}

function loadProfile() {
  const saved = JSON.parse(localStorage.getItem(getProfileKey())) || {};
  const currentUser = getCurrentUser();

  profileName.value = saved.name || currentUser?.username || "";
  profileEmail.value = saved.email || "";
  currentWeight.value = saved.currentWeight || "";
  goalWeight.value = saved.goalWeight || "";
  fitnessGoal.value = saved.fitnessGoal || "";

  const photo = saved.photo || "";
  const displayName = saved.name || currentUser?.username || "U";

  if (photo) {
    avatarPreview.innerHTML = `<img src="${photo}" alt="Profile photo" class="avatar-image">`;
  } else {
    avatarPreview.innerHTML = `<span id="avatarInitial">${displayName.charAt(0).toUpperCase()}</span>`;
  }
}

function saveProfile(event) {
  event.preventDefault();

  const existing = JSON.parse(localStorage.getItem(getProfileKey())) || {};

  const data = {
    ...existing,
    name: profileName.value.trim(),
    email: profileEmail.value.trim(),
    currentWeight: currentWeight.value,
    goalWeight: goalWeight.value,
    fitnessGoal: fitnessGoal.value
  };

  localStorage.setItem(getProfileKey(), JSON.stringify(data));
  profileMessage.textContent = "Profile saved.";
}

function loadPreferences() {
  const saved = JSON.parse(localStorage.getItem(getPreferencesKey())) || {};

  notificationsToggle.checked = Boolean(saved.notifications);
  themePreference.value = saved.theme || "dark";

  applyTheme(saved.theme || "dark");
}

function savePreferences() {
  const data = {
    notifications: notificationsToggle.checked,
    theme: themePreference.value
  };

  localStorage.setItem(getPreferencesKey(), JSON.stringify(data));
  applyTheme(data.theme);
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const saved = JSON.parse(localStorage.getItem(getProfileKey())) || {};
    saved.photo = e.target.result;
    localStorage.setItem(getProfileKey(), JSON.stringify(saved));
    loadProfile();
    profileMessage.textContent = "Profile photo updated.";
  };

  reader.readAsDataURL(file);
}

function exportUserData() {
  const profile = JSON.parse(localStorage.getItem(getProfileKey())) || {};
  const preferences = JSON.parse(localStorage.getItem(getPreferencesKey())) || {};
  const user = getCurrentUser();

  const data = {
    user,
    profile,
    preferences,
    favoriteFoods: JSON.parse(localStorage.getItem(`favoriteFoods_${user.username}`)) || [],
    savedWorkouts: JSON.parse(localStorage.getItem(`savedWorkouts_${user.username}`)) || [],
    dailyNutritionLog: JSON.parse(localStorage.getItem(`dailyNutritionLog_${user.username}`)) || []
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${user.username}-tabanka-data.json`;
  link.click();

  URL.revokeObjectURL(url);
  accountMessage.textContent = "Data exported.";
}

function deleteAccountData() {
  const user = getCurrentUser();
  if (!user) return;

  const confirmed = confirm("Delete your saved account data from this browser?");
  if (!confirmed) return;

  const keysToRemove = [
    `profile_${user.username}`,
    `preferences_${user.username}`,
    `favoriteFoods_${user.username}`,
    `savedWorkouts_${user.username}`,
    `dailyNutritionLog_${user.username}`
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));
  localStorage.removeItem("currentUser");

  window.location.href = "../index.html";
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
});

async function installApp() {
  if (!deferredPrompt) {
    accountMessage.textContent = "Install is not available yet. Try Chrome and refresh the page.";
    return;
  }

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  accountMessage.textContent = "Install prompt opened.";
}

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  accountMessage.textContent = "App installed successfully.";
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
});

profileForm.addEventListener("submit", saveProfile);
notificationsToggle.addEventListener("change", savePreferences);
themePreference.addEventListener("change", savePreferences);

uploadPhotoBtn.addEventListener("click", () => {
  photoInput.click();
});

photoInput.addEventListener("change", handlePhotoUpload);

installAppBtn.addEventListener("click", installApp);

changePasswordBtn.addEventListener("click", () => {
  accountMessage.textContent = "Password changing is not connected yet.";
});

exportDataBtn.addEventListener("click", exportUserData);
deleteAccountBtn.addEventListener("click", deleteAccountData);

protectPage();
updateUserStatus();
loadProfile();
loadPreferences();