const totalFoods = document.getElementById("totalFoods");
const totalSavedWorkouts = document.getElementById("totalSavedWorkouts");
const totalCalories = document.getElementById("totalCalories");
const totalProtein = document.getElementById("totalProtein");

const summaryCalories = document.getElementById("summaryCalories");
const summaryProtein = document.getElementById("summaryProtein");
const summaryCarbs = document.getElementById("summaryCarbs");
const summaryFat = document.getElementById("summaryFat");

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

function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
}

function protectPage() {
  if (!getCurrentUser()) {
    alert("You must be logged in to view this page.");
    window.location.href = "auth.html";
  }
}

function updateUserStatus() {
  const currentUser = getCurrentUser();
  userStatus.textContent = currentUser ? `Logged in as ${currentUser.username}` : "Guest";
}

function loadDashboardData() {
  const foodsKey = getUserStorageKey("favoriteFoods");
  const workoutsKey = getUserStorageKey("savedWorkouts");

  const favoriteFoods = JSON.parse(localStorage.getItem(foodsKey)) || [];
  const savedWorkouts = JSON.parse(localStorage.getItem(workoutsKey)) || [];

  const calories = favoriteFoods.reduce((sum, food) => sum + Number(food.calories || 0), 0);
  const protein = favoriteFoods.reduce((sum, food) => sum + Number(food.protein || 0), 0);
  const carbs = favoriteFoods.reduce((sum, food) => sum + Number(food.carbs || 0), 0);
  const fat = favoriteFoods.reduce((sum, food) => sum + Number(food.fat || 0), 0);

  totalFoods.textContent = favoriteFoods.length;
  totalSavedWorkouts.textContent = savedWorkouts.length;
  totalCalories.textContent = calories;
  totalProtein.textContent = `${protein} g`;

  summaryCalories.textContent = `${calories} kcal`;
  summaryProtein.textContent = `${protein} g`;
  summaryCarbs.textContent = `${carbs} g`;
  summaryFat.textContent = `${fat} g`;

  renderSavedWorkouts(savedWorkouts);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
            <h3>Workout Session</h3>
            <p class="muted-text">${workout.date}</p>
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

logoutBtn.addEventListener("click", logoutUser);

protectPage();
updateUserStatus();
loadDashboardData();