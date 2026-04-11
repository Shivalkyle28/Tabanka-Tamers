const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

const profileForm = document.getElementById("profileForm");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const currentWeight = document.getElementById("currentWeight");
const goalWeight = document.getElementById("goalWeight");
const fitnessGoal = document.getElementById("fitnessGoal");
const profileMessage = document.getElementById("profileMessage");

const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const photoInput = document.getElementById("photoInput");
const avatarPreview = document.getElementById("avatarPreview");
const avatarInitial = document.getElementById("avatarInitial");

const unitsToggle = document.getElementById("unitsToggle");
const notificationsToggle = document.getElementById("notificationsToggle");
const themePreference = document.getElementById("themePreference");

const changePasswordBtn = document.getElementById("changePasswordBtn");
const exportDataBtn = document.getElementById("exportDataBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const accountMessage = document.getElementById("accountMessage");

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function protectPage() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("You must be logged in to view this page.");
    window.location.href = "auth.html";
  }
}

function getUserStorageKey(baseKey) {
  const currentUser = getCurrentUser();
  return currentUser ? `${baseKey}_${currentUser.username}` : null;
}

function updateUserStatus() {
  const currentUser = getCurrentUser();
  userStatus.textContent = currentUser ? `Logged in as ${currentUser.username}` : "Guest";
}

function getProfileKey() {
  return getUserStorageKey("profile");
}

function getPreferencesKey() {
  return getUserStorageKey("preferences");
}

function loadProfile() {
  const currentUser = getCurrentUser();
  const savedProfile = JSON.parse(localStorage.getItem(getProfileKey())) || {};

  profileName.value = savedProfile.name || currentUser.username || "";
  profileEmail.value = savedProfile.email || currentUser.email || "";
  currentWeight.value = savedProfile.currentWeight || "";
  goalWeight.value = savedProfile.goalWeight || "";
  fitnessGoal.value = savedProfile.fitnessGoal || "";

  updateAvatar(savedProfile);
}

function updateAvatar(profileData) {
  if (profileData.photo) {
    avatarPreview.innerHTML = `<img src="${profileData.photo}" alt="Profile photo" class="avatar-image" />`;
  } else {
    const letter = (profileData.name || getCurrentUser().username || "U").charAt(0).toUpperCase();
    avatarPreview.innerHTML = `<span id="avatarInitial">${letter}</span>`;
  }
}

function saveProfile(event) {
  event.preventDefault();

  const profileData = JSON.parse(localStorage.getItem(getProfileKey())) || {};

  profileData.name = profileName.value.trim();
  profileData.email = profileEmail.value.trim();
  profileData.currentWeight = currentWeight.value;
  profileData.goalWeight = goalWeight.value;
  profileData.fitnessGoal = fitnessGoal.value;

  localStorage.setItem(getProfileKey(), JSON.stringify(profileData));

  profileMessage.textContent = "Profile updated successfully.";
  updateAvatar(profileData);
  syncUserEmail(profileData.email);
}

function syncUserEmail(newEmail) {
  const currentUser = getCurrentUser();
  const users = getUsers();

  const updatedUsers = users.map(user => {
    if (user.username === currentUser.username) {
      return {
        ...user,
        email: newEmail || user.email
      };
    }
    return user;
  });

  saveUsers(updatedUsers);

  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      username: currentUser.username,
      email: newEmail || currentUser.email
    })
  );
}

function loadPreferences() {
  const preferences = JSON.parse(localStorage.getItem(getPreferencesKey())) || {};

  unitsToggle.checked = preferences.units === "kg";
  notificationsToggle.checked = Boolean(preferences.notifications);
  themePreference.value = preferences.theme || "dark";
}

function savePreferences() {
  const preferences = {
    units: unitsToggle.checked ? "kg" : "lb",
    notifications: notificationsToggle.checked,
    theme: themePreference.value
  };

  localStorage.setItem(getPreferencesKey(), JSON.stringify(preferences));
}

function exportUserData() {
  const currentUser = getCurrentUser();

  const exportData = {
    currentUser,
    profile: JSON.parse(localStorage.getItem(getProfileKey())) || {},
    preferences: JSON.parse(localStorage.getItem(getPreferencesKey())) || {},
    favoriteFoods: JSON.parse(localStorage.getItem(getUserStorageKey("favoriteFoods"))) || [],
    favoriteExercises: JSON.parse(localStorage.getItem(getUserStorageKey("favoriteExercises"))) || [],
    savedWorkouts: JSON.parse(localStorage.getItem(getUserStorageKey("savedWorkouts"))) || []
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentUser.username}-caribbeanfit-data.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  accountMessage.textContent = "Your data export is ready.";
}

function changePassword() {
  const currentUser = getCurrentUser();
  const users = getUsers();

  const newPassword = prompt("Enter your new password:");

  if (!newPassword || newPassword.trim().length < 4) {
    accountMessage.textContent = "Password must be at least 4 characters.";
    return;
  }

  const updatedUsers = users.map(user => {
    if (user.username === currentUser.username) {
      return {
        ...user,
        password: newPassword.trim()
      };
    }
    return user;
  });

  saveUsers(updatedUsers);
  accountMessage.textContent = "Password updated successfully.";
}

function deleteAccount() {
  const currentUser = getCurrentUser();
  const confirmed = confirm("Are you sure you want to delete your account? This cannot be undone.");

  if (!confirmed) {
    return;
  }

  const users = getUsers().filter(user => user.username !== currentUser.username);
  saveUsers(users);

  localStorage.removeItem(getProfileKey());
  localStorage.removeItem(getPreferencesKey());
  localStorage.removeItem(getUserStorageKey("favoriteFoods"));
  localStorage.removeItem(getUserStorageKey("favoriteExercises"));
  localStorage.removeItem(getUserStorageKey("savedWorkouts"));
  localStorage.removeItem("currentUser");

  window.location.href = "../index.html";
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const profileData = JSON.parse(localStorage.getItem(getProfileKey())) || {};
    profileData.photo = e.target.result;

    localStorage.setItem(getProfileKey(), JSON.stringify(profileData));
    updateAvatar(profileData);
    profileMessage.textContent = "Profile photo updated.";
  };

  reader.readAsDataURL(file);
}

logoutBtn.addEventListener("click", function () {
  logoutUser();
});

profileForm.addEventListener("submit", saveProfile);

uploadPhotoBtn.addEventListener("click", function () {
  photoInput.click();
});

photoInput.addEventListener("change", handlePhotoUpload);

unitsToggle.addEventListener("change", savePreferences);
notificationsToggle.addEventListener("change", savePreferences);
themePreference.addEventListener("change", savePreferences);

changePasswordBtn.addEventListener("click", changePassword);
exportDataBtn.addEventListener("click", exportUserData);
deleteAccountBtn.addEventListener("click", deleteAccount);

protectPage();
updateUserStatus();
loadProfile();
loadPreferences();