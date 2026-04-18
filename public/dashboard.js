/* =========================
   1. DOM ELEMENTS
========================= */
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
   2. HELPERS
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
    userStatus.onclick = () => { window.location.href = "profile.html"; };
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

function getTodayString() {
  return new Date().toLocaleDateString();
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/* =========================
   3. ACCORDION TOGGLE LOGIC
========================= */
window.toggleAccordion = function(element) {
  const content = element.nextElementSibling;
  const icon = element.querySelector('.toggle-icon');

  const isActive = content.classList.contains('active');
  
  // Optional: Close all other open accordions
  document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('active'));
  document.querySelectorAll('.toggle-icon').forEach(i => i.textContent = '+');

  if (!isActive) {
    content.classList.add('active');
    element.classList.add('active');
    icon.textContent = '-';
  }
};

/* =========================
   4. DASHBOARD DATA LOADING
========================= */
function loadDashboardData() {
  const user = getCurrentUser();
  if (!user) return;

  const foodsKey = getUserStorageKey("favoriteFoods");
  const workoutsKey = getUserStorageKey("savedWorkouts");
  const profileKey = `profile_${user.username}`;

  const foods = JSON.parse(localStorage.getItem(foodsKey)) || [];
  const workouts = JSON.parse(localStorage.getItem(workoutsKey)) || [];
  const profile = JSON.parse(localStorage.getItem(profileKey)) || {};

  // Calculate favorite foods summary
  const calories = foods.reduce((sum, f) => sum + Number(f.calories || 0), 0);
  const protein = foods.reduce((sum, f) => sum + Number(f.protein_g || 0), 0);
  const carbs = foods.reduce((sum, f) => sum + Number(f.carbs_g || 0), 0);
  const fat = foods.reduce((sum, f) => sum + Number(f.fat_g || 0), 0);

  // Update Stats Grid
  totalFoods.textContent = foods.length;
  totalSavedWorkouts.textContent = workouts.length;
  
  // Use "Total XP" instead of just calories for the 3rd stat card if preferred
  const totalXPEl = document.getElementById("totalXP");
  if(totalXPEl) totalXPEl.textContent = profile.totalXp || 0;
  
  // Existing calorie/protein card updates
  if(totalCalories) totalCalories.textContent = calories;
  if(totalProtein) totalProtein.textContent = `${protein} g`;

  // Update "The Lime Summary" (Favorites)
  summaryCalories.textContent = `${calories} kcal`;
  summaryProtein.textContent = `${protein} g`;
  summaryCarbs.textContent = `${carbs} g`;
  summaryFat.textContent = `${fat} g`;

  renderTodayLog();
  renderWorkoutAccordion(workouts);
}

/* =========================
   5. RENDER WORKOUT ACCORDION (PAST LIMES)
========================= */
function deleteSavedWorkout(event, id) {
  event.stopPropagation(); // Prevents the accordion from opening when clicking delete
  const key = getUserStorageKey("savedWorkouts");
  let workouts = JSON.parse(localStorage.getItem(key)) || [];
  workouts = workouts.filter(w => w.id !== id);
  localStorage.setItem(key, JSON.stringify(workouts));
  loadDashboardData();
}

function renderWorkoutAccordion(workouts) {
  savedWorkoutsContainer.innerHTML = "";

  if (workouts.length === 0) {
    savedWorkoutsContainer.innerHTML = `<p class="empty-state">No past limes found.</p>`;
    return;
  }

  // Newest workouts first
  [...workouts].reverse().forEach(w => {
    const totalSets = w.exercises.reduce((sum, ex) => sum + (Number(ex.sets) || 0), 0);
    
    savedWorkoutsContainer.innerHTML += `
      <div class="workout-accordion">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          <div class="header-main">
            <strong>Session: ${w.date}</strong>
            <span class="lime-tag">${totalSets} Sets Completed • ${w.exercises.length} Exercises</span>
          </div>
          <div style="display: flex; align-items: center; gap: 15px;">
            <button class="btn-secondary small-btn" onclick="deleteSavedWorkout(event, ${w.id})">Delete</button>
            <span class="toggle-icon">+</span>
          </div>
        </div>
        <div class="accordion-content">
          <div class="saved-exercise-list">
             <p style="margin-bottom: 10px;"><strong>Duration:</strong> ${formatTime(w.durationSeconds)}</p>
            ${w.exercises.map(e => `
              <div class="saved-exercise-row">
                <span>${e.name}</span>
                <span class="muted-text">${e.sets} × ${e.reps} @ ${e.weight} lbs</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  });
}

/* =========================
   6. TODAY'S VIBES (NUTRITION LOG)
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
  const today = new Date().toLocaleDateString(); 
  
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
    todayLogContainer.innerHTML = `<p class="empty-state">No vibes logged for today yet.</p>`;
    return;
  }

  entries.slice().reverse().forEach(e => {
    todayLogContainer.innerHTML += `
      <div class="summary-row" style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div>
          <strong>${e.name}</strong><br>
          <small class="muted-text">${e.calories} kcal | ${e.protein_g}g P</small>
        </div>
        <button class="btn-secondary small-btn" onclick="deleteTodayLogEntry(${e.entryId})">Delete</button>
      </div>
    `;
  });
}

/* =========================
   7. INIT
========================= */
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

protectPage();
updateNavbar();
loadDashboardData();
