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

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getUserStorageKey(baseKey) {
  const currentUser = getCurrentUser();
  return currentUser ? `${baseKey}_${currentUser.username}` : null;
}

function logoutUserLocal() {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
}

function protectPage() {
  if (!getCurrentUser()) {
    alert("You must be logged in to view this page.");
    window.location.href = "auth.html";
  }
}

function updateNavbarForPagesLocal() {
  const currentUser = getCurrentUser();

  if (userStatus) {
    if (currentUser) {
      userStatus.textContent = currentUser.username;
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
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function loadDashboardData() {
  const foodsKey = getUserStorageKey("favoriteFoods");
  const workoutsKey = getUserStorageKey("savedWorkouts");

  const favoriteFoods = JSON.parse(localStorage.getItem(foodsKey)) || [];
  const savedWorkouts = JSON.parse(localStorage.getItem(workoutsKey)) || [];

  const calories = favoriteFoods.reduce((sum, food) => sum + Number(food.calories || 0), 0);
  const protein = favoriteFoods.reduce((sum, food) => sum + Number(food.protein_g || 0), 0);
  const carbs = favoriteFoods.reduce((sum, food) => sum + Number(food.carbs_g || 0), 0);
  const fat = favoriteFoods.reduce((sum, food) => sum + Number(food.fat_g || 0), 0);

  totalFoods.textContent = favoriteFoods.length;
  totalSavedWorkouts.textContent = savedWorkouts.length;
  totalCalories.textContent = calories;
  totalProtein.textContent = `${protein} g`;

  summaryCalories.textContent = `${calories} kcal`;
  summaryProtein.textContent = `${protein} g`;
  summaryCarbs.textContent = `${carbs} g`;
  summaryFat.textContent = `${fat} g`;

  renderTodayLog();
  renderSavedWorkouts(savedWorkouts);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function deleteSavedWorkout(workoutId) {
  const storageKey = getUserStorageKey("savedWorkouts");
  let savedWorkouts = JSON.parse(localStorage.getItem(storageKey)) || [];

  savedWorkouts = savedWorkouts.filter(workout => workout.id !== workoutId);
  localStorage.setItem(storageKey, JSON.stringify(savedWorkouts));

  loadDashboardData();
}

function renderSavedWorkouts(savedWorkouts) {
  savedWorkoutsContainer.innerHTML = "";

  if (savedWorkouts.length === 0) {
    savedWorkoutsContainer.innerHTML = `<p class="empty-state">No saved workouts yet.</p>`;
    return;
  }

  savedWorkouts
    .slice()
    .reverse()
    .forEach(workout => {
      savedWorkoutsContainer.innerHTML += `
        <div class="saved-workout-card">
          <div class="saved-workout-header">
            <div>
              <h3>Workout Session</h3>
              <p class="muted-text">${workout.date}</p>
            </div>
            <button class="btn-secondary small-btn" onclick="deleteSavedWorkout(${workout.id})">
              Delete
            </button>
          </div>

          <p><strong>Duration:</strong> ${formatTime(workout.durationSeconds)}</p>
          <p><strong>Exercises:</strong> ${workout.exercises.length}</p>

          <div class="saved-exercise-list">
            ${workout.exercises.map(exercise => `
              <div class="saved-exercise-row">
                <span>${exercise.name}</span>
                <span>${exercise.sets} sets × ${exercise.reps} reps @ ${exercise.weight} lbs</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    });
}

function deleteTodayLogEntry(entryId) {
  const storageKey = getUserStorageKey("dailyNutritionLog");
  let dailyLog = JSON.parse(localStorage.getItem(storageKey)) || [];

  dailyLog = dailyLog.filter(entry => entry.entryId !== entryId);
  localStorage.setItem(storageKey, JSON.stringify(dailyLog));

  renderTodayLog();
}

function renderTodayLog() {
  const storageKey = getUserStorageKey("dailyNutritionLog");
  const dailyLog = JSON.parse(localStorage.getItem(storageKey)) || [];
  const today = getTodayString();

  const todayEntries = dailyLog.filter(entry => entry.date === today);

  const calories = todayEntries.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  const protein = todayEntries.reduce((sum, item) => sum + Number(item.protein_g || 0), 0);
  const carbs = todayEntries.reduce((sum, item) => sum + Number(item.carbs_g || 0), 0);
  const fat = todayEntries.reduce((sum, item) => sum + Number(item.fat_g || 0), 0);

  todayCalories.textContent = `${calories} kcal`;
  todayProtein.textContent = `${protein} g`;
  todayCarbs.textContent = `${carbs} g`;
  todayFat.textContent = `${fat} g`;

  todayLogContainer.innerHTML = "";

  if (todayEntries.length === 0) {
    todayLogContainer.innerHTML = `<p class="empty-state">No foods logged for today yet.</p>`;
    return;
  }

  todayEntries
    .slice()
    .reverse()
    .forEach(entry => {
      todayLogContainer.innerHTML += `
        <div class="saved-workout-card">
          <div class="saved-workout-header">
            <div>
              <h3>${entry.name}</h3>
              <p class="muted-text">${entry.date}</p>
            </div>
            <button class="btn-secondary small-btn" onclick="deleteTodayLogEntry(${entry.entryId})">
              Delete
            </button>
          </div>

          <div class="saved-exercise-list">
            <div class="saved-exercise-row">
              <span>Calories</span>
              <span>${entry.calories} kcal</span>
            </div>
            <div class="saved-exercise-row">
              <span>Protein</span>
              <span>${entry.protein_g} g</span>
            </div>
            <div class="saved-exercise-row">
              <span>Carbs</span>
              <span>${entry.carbs_g} g</span>
            </div>
            <div class="saved-exercise-row">
              <span>Fat</span>
              <span>${entry.fat_g} g</span>
            </div>
          </div>
        </div>
      `;
    });
}

logoutBtn.addEventListener("click", logoutUserLocal);

protectPage();
updateNavbarForPagesLocal();
loadDashboardData();