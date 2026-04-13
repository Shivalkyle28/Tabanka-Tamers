const totalFoods = document.getElementById("totalFoods");
const totalSavedWorkouts = document.getElementById("totalSavedWorkouts");
const totalCalories = document.getElementById("totalCalories");
const totalProtein = document.getElementById("totalProtein");

const summaryCalories = document.getElementById("summaryCalories");
const summaryProtein = document.getElementById("summaryProtein");
const summaryCarbs = document.getElementById("summaryCarbs");
const summaryFat = document.getElementById("summaryFat");

const todayCalories = document.getElementById("todayCalories");
const todayProtein = document.getElementById("todayProtein");
const todayCarbs = document.getElementById("todayCarbs");
const todayFat = document.getElementById("todayFat");

const todayLogContainer = document.getElementById("todayLogContainer");
const savedWorkoutsContainer = document.getElementById("savedWorkoutsContainer");

const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   HELPERS
========================= */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getUserStorageKey(baseKey) {
  const user = getCurrentUser();
  return user ? `${baseKey}_${user.username}` : null;
}

function protectPage() {
  if (!getCurrentUser()) {
    alert("You must be logged in to view this page.");
    window.location.href = "auth.html";
  }
}

function updateNavbar() {
  const user = getCurrentUser();

  if (!userStatus) return;

  if (user) {
    userStatus.textContent = user.username;
    userStatus.classList.add("clickable-user");
    userStatus.onclick = () => {
      window.location.href = "profile.html";
    };
  } else {
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
   DATE / TIME
========================= */
function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/* =========================
   DASHBOARD DATA
========================= */
function loadDashboardData() {
  const foodsKey = getUserStorageKey("favoriteFoods");
  const workoutsKey = getUserStorageKey("savedWorkouts");

  const foods = JSON.parse(localStorage.getItem(foodsKey)) || [];
  const workouts = JSON.parse(localStorage.getItem(workoutsKey)) || [];

  const calories = foods.reduce((sum, f) => sum + Number(f.calories || 0), 0);
  const protein = foods.reduce((sum, f) => sum + Number(f.protein_g || 0), 0);
  const carbs = foods.reduce((sum, f) => sum + Number(f.carbs_g || 0), 0);
  const fat = foods.reduce((sum, f) => sum + Number(f.fat_g || 0), 0);

  totalFoods.textContent = foods.length;
  totalSavedWorkouts.textContent = workouts.length;
  totalCalories.textContent = calories;
  totalProtein.textContent = `${protein} g`;

  summaryCalories.textContent = `${calories} kcal`;
  summaryProtein.textContent = `${protein} g`;
  summaryCarbs.textContent = `${carbs} g`;
  summaryFat.textContent = `${fat} g`;

  renderTodayLog();
  renderSavedWorkouts(workouts);
}

/* =========================
   WORKOUTS
========================= */
function deleteSavedWorkout(id) {
  const key = getUserStorageKey("savedWorkouts");
  let workouts = JSON.parse(localStorage.getItem(key)) || [];

  workouts = workouts.filter(w => w.id !== id);
  localStorage.setItem(key, JSON.stringify(workouts));

  loadDashboardData();
}

function renderSavedWorkouts(workouts) {
  savedWorkoutsContainer.innerHTML = "";

  if (workouts.length === 0) {
    savedWorkoutsContainer.innerHTML =
      `<p class="empty-state">No saved workouts yet.</p>`;
    return;
  }

  workouts.slice().reverse().forEach(w => {
    savedWorkoutsContainer.innerHTML += `
      <div class="saved-workout-card">
        <div class="saved-workout-header">
          <div>
            <h3>Workout Session</h3>
            <p class="muted-text">${w.date}</p>
          </div>
          <button class="btn-secondary small-btn" onclick="deleteSavedWorkout(${w.id})">
            Delete
          </button>
        </div>

        <p><strong>Duration:</strong> ${formatTime(w.durationSeconds)}</p>
        <p><strong>Exercises:</strong> ${w.exercises.length}</p>

        <div class="saved-exercise-list">
          ${w.exercises.map(e => `
            <div class="saved-exercise-row">
              <span>${e.name}</span>
              <span>${e.sets} × ${e.reps} @ ${e.weight} lbs</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  });
}

/* =========================
   TODAY LOG
========================= */
function deleteTodayLogEntry(id) {
  const key = getUserStorageKey("dailyNutritionLog");
  let log = JSON.parse(localStorage.getItem(key)) || [];

  log = log.filter(e => e.entryId !== id);
  localStorage.setItem(key, JSON.stringify(log));

  renderTodayLog();
}

function renderTodayLog() {
  const key = getUserStorageKey("dailyNutritionLog");
  const log = JSON.parse(localStorage.getItem(key)) || [];

  const today = getTodayString();
  const entries = log.filter(e => e.date === today);

  const calories = entries.reduce((s, e) => s + Number(e.calories || 0), 0);
  const protein = entries.reduce((s, e) => s + Number(e.protein_g || 0), 0);
  const carbs = entries.reduce((s, e) => s + Number(e.carbs_g || 0), 0);
  const fat = entries.reduce((s, e) => s + Number(e.fat_g || 0), 0);

  todayCalories.textContent = `${calories} kcal`;
  todayProtein.textContent = `${protein} g`;
  todayCarbs.textContent = `${carbs} g`;
  todayFat.textContent = `${fat} g`;

  todayLogContainer.innerHTML = "";

  if (entries.length === 0) {
    todayLogContainer.innerHTML =
      `<p class="empty-state">No foods logged for today yet.</p>`;
    return;
  }

  entries.slice().reverse().forEach(e => {
    todayLogContainer.innerHTML += `
      <div class="saved-workout-card">
        <div class="saved-workout-header">
          <div>
            <h3>${e.name}</h3>
            <p class="muted-text">${e.date}</p>
          </div>
          <button class="btn-secondary small-btn" onclick="deleteTodayLogEntry(${e.entryId})">
            Delete
          </button>
        </div>

        <div class="saved-exercise-list">
          <div class="saved-exercise-row"><span>Calories</span><span>${e.calories} kcal</span></div>
          <div class="saved-exercise-row"><span>Protein</span><span>${e.protein_g} g</span></div>
          <div class="saved-exercise-row"><span>Carbs</span><span>${e.carbs_g} g</span></div>
          <div class="saved-exercise-row"><span>Fat</span><span>${e.fat_g} g</span></div>
        </div>
      </div>
    `;
  });
}

/* =========================
   INIT
========================= */
logoutBtn.addEventListener("click", logoutUser);

protectPage();
updateNavbar();
loadDashboardData();