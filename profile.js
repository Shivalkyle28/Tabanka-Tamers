const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

const profileForm = document.getElementById("profileForm");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const currentWeight = document.getElementById("currentWeight");
const goalWeight = document.getElementById("goalWeight");
const fitnessGoal = document.getElementById("fitnessGoal");
const profileMessage = document.getElementById("profileMessage");

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getProfileKey() {
  const user = getCurrentUser();
  return user ? `profile_${user.username}` : null;
}

function protectPage() {
  if (!getCurrentUser()) {
    alert("You must be logged in.");
    window.location.href = "auth.html";
  }
}

function updateUserStatus() {
  const user = getCurrentUser();
  userStatus.textContent = user ? `Logged in as ${user.username}` : "Guest";
}

function loadProfile() {
  const saved = JSON.parse(localStorage.getItem(getProfileKey())) || {};

  profileName.value = saved.name || "";
  profileEmail.value = saved.email || "";
  currentWeight.value = saved.currentWeight || "";
  goalWeight.value = saved.goalWeight || "";
  fitnessGoal.value = saved.fitnessGoal || "";
}

function saveProfile(e) {
  e.preventDefault();

  const data = {
    name: profileName.value,
    email: profileEmail.value,
    currentWeight: currentWeight.value,
    goalWeight: goalWeight.value,
    fitnessGoal: fitnessGoal.value
  };

  localStorage.setItem(getProfileKey(), JSON.stringify(data));

  profileMessage.textContent = "Profile saved!";
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
});

profileForm.addEventListener("submit", saveProfile);

protectPage();
updateUserStatus();
loadProfile();