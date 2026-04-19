/* =========================
   1. GAMIFICATION ENGINE
========================= */
const GAMIFICATION_CONFIG = {
  POINTS_PER_SET: 5,
  LEVEL_BASE_XP: 100,
  EXPONENT: 1.5,
  RANKS: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]
};

const GamificationService = {
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
   2. DOM ELEMENTS
========================= */
const frontBodySvg = document.getElementById("frontBodySvg");
const backBodySvg = document.getElementById("backBodySvg");
const workoutExercisesContainer = document.getElementById("workoutExercisesContainer");
const currentWorkoutContainer = document.getElementById("currentWorkoutContainer");
const selectedMusclesText = document.getElementById("selectedMusclesText");
const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");
const exerciseSearchInput = document.getElementById("exerciseSearchInput");
const exerciseMuscleFilter = document.getElementById("exerciseMuscleFilter");
const workoutTimerDisplay = document.getElementById("workoutTimerDisplay");
const restTimerDisplay = document.getElementById("restTimerDisplay");
const startWorkoutTimerBtn = document.getElementById("startWorkoutTimerBtn");
const pauseWorkoutTimerBtn = document.getElementById("pauseWorkoutTimerBtn");
const resetWorkoutTimerBtn = document.getElementById("resetWorkoutTimerBtn");
const startRestTimerBtn = document.getElementById("startRestTimerBtn");
const pauseRestTimerBtn = document.getElementById("pauseRestTimerBtn");
const resetRestTimerBtn = document.getElementById("resetRestTimerBtn");
const saveWorkoutBtn = document.getElementById("saveWorkoutBtn");
const clearWorkoutBtn = document.getElementById("clearWorkoutBtn");

const xpProgressBar = document.getElementById("xp-progress-bar");
const userLevelEl = document.getElementById("user-level");
const userRankEl = document.getElementById("user-rank");
const xpTextEl = document.getElementById("xp-text");
const rewardToast = document.getElementById("reward-toast");

/* =========================
   3. STATE & CONFIG
========================= */
const EXERCISE_JSON_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const EXERCISE_IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

let allExercises = [];
let currentWorkout = [];
let workoutSeconds = 0;
let workoutTimerInterval = null;
let restSeconds = 60;
let restTimeRemaining = 60;
let restTimerInterval = null;

/* =========================
   4. CORE FUNCTIONS
========================= */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getUserStorageKey(baseKey) {
  const user = getCurrentUser();
  return user ? `${baseKey}_${user.username}` : null;
}

function updateGamificationUI() {
  const user = getCurrentUser();
  if (!user) return;

  const profileKey = `profile_${user.username}`;
  const profileData = JSON.parse(localStorage.getItem(profileKey)) || {};
  const currentXp = profileData.totalXp || 0;

  const totalLevel = GamificationService.calculateLevel(currentXp);
  const tieredRank = GamificationService.getTieredRank(totalLevel);

  const nextThreshold = GamificationService.getXpThreshold(totalLevel);
  const prevThreshold =
    totalLevel === 1 ? 0 : GamificationService.getXpThreshold(totalLevel - 1);

  let progressPercent = 0;
  if (nextThreshold > prevThreshold) {
    progressPercent =
      ((currentXp - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
  }

  if (userRankEl) userRankEl.textContent = tieredRank;

  if (userLevelEl && userLevelEl.parentElement) {
    userLevelEl.parentElement.style.display = "none";
  }

  if (xpTextEl) {
    xpTextEl.textContent = `${currentXp} / ${nextThreshold} XP`;
  }

  if (xpProgressBar) {
    xpProgressBar.style.width = `${Math.min(
      Math.max(progressPercent, 0),
      100
    )}%`;
  }
}

function triggerRewardToast(level) {
  if (!rewardToast) return;

  const rankDisplay = GamificationService.getTieredRank(level);
  const rewardMessage = document.getElementById("reward-message");

  if (rewardMessage) {
    rewardMessage.textContent = `Promoted to ${rankDisplay}!`;
  }

  rewardToast.classList.add("show");
  setTimeout(() => rewardToast.classList.remove("show"), 4000);
}

function updateUserStatus() {
  const user = getCurrentUser();

  if (user) {
    if (userStatus) {
      userStatus.textContent = user.username;
      userStatus.classList.add("clickable-user");
      userStatus.onclick = () => {
        window.location.href = "profile.html";
      };
    }
    updateGamificationUI();
  } else {
    if (userStatus) {
      userStatus.textContent = "Guest";
      userStatus.classList.remove("clickable-user");
      userStatus.onclick = null;
    }
  }
}

/* =========================
   5. VISUALS (BODY HIGHLIGHTS)
========================= */
function clearBodyHighlights() {
  [frontBodySvg, backBodySvg].forEach((svgObject) => {
    if (!svgObject || !svgObject.contentDocument) return;

    const activeParts = svgObject.contentDocument.querySelectorAll(".muscle");
    activeParts.forEach((part) => {
      part.classList.remove("active");
      part.classList.add("inactive");
    });
  });
}

function highlightMuscleParts(muscles) {
  clearBodyHighlights();

  const muscleMap = {
    chest: ["chest"],
    shoulders: ["shoulders", "shoulders2", "rearshoulders", "rearshoulders2"],
    biceps: ["biceps", "biceps2"],
    triceps: ["triceps", "triceps2"],
    forearms: ["forearms", "forearms2"],
    abdominals: ["abs"],
    abs: ["abs"],
    quadriceps: ["quads", "quads2"],
    quads: ["quads", "quads2"],
    calves: ["calves", "calves2"],
    hamstrings: ["hamstrings", "hamstrings2"],
    glutes: ["glutes", "glutes2"],
    lats: ["lats", "lats2"],
    back: ["lats", "lats2", "lowerback", "traps"],
    traps: ["traps"],
    lowerback: ["lowerback"],
    lower_back: ["lowerback"]
  };

  const svgDocs = [frontBodySvg?.contentDocument, backBodySvg?.contentDocument];

  muscles.forEach((muscle) => {
    const normalized = muscle
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "");

    const ids = muscleMap[normalized] || [];

    svgDocs.forEach((doc) => {
      if (!doc) return;

      ids.forEach((id) => {
        const el = doc.getElementById(id);
        if (el) {
          el.classList.remove("inactive");
          el.classList.add("active");
        }
      });
    });
  });
}

/* =========================
   6. TIMERS
========================= */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateWorkoutTimerDisplay() {
  if (workoutTimerDisplay) {
    workoutTimerDisplay.textContent = formatTime(workoutSeconds);
  }
}

function startWorkoutTimer() {
  if (workoutTimerInterval) return;

  workoutTimerInterval = setInterval(() => {
    workoutSeconds += 1;
    updateWorkoutTimerDisplay();
  }, 1000);
}

function pauseWorkoutTimer() {
  clearInterval(workoutTimerInterval);
  workoutTimerInterval = null;
}

function resetWorkoutTimer() {
  pauseWorkoutTimer();
  workoutSeconds = 0;
  updateWorkoutTimerDisplay();
}

function updateRestTimerDisplay() {
  if (restTimerDisplay) {
    restTimerDisplay.textContent = formatTime(restTimeRemaining);
  }
}

function startRestTimer() {
  if (restTimerInterval) return;

  restTimerInterval = setInterval(() => {
    if (restTimeRemaining > 0) {
      restTimeRemaining -= 1;
      updateRestTimerDisplay();
    } else {
      clearInterval(restTimerInterval);
      restTimerInterval = null;
      alert("Rest time is up!");
    }
  }, 1000);
}

function pauseRestTimer() {
  clearInterval(restTimerInterval);
  restTimerInterval = null;
}

function resetRestTimer() {
  pauseRestTimer();
  restTimeRemaining = restSeconds;
  updateRestTimerDisplay();
}

function setRestPreset(seconds) {
  restSeconds = seconds;
  restTimeRemaining = seconds;
  updateRestTimerDisplay();
}

/* =========================
   7. EXERCISE LOADING
========================= */
function getExerciseImageUrl(exercise) {
  if (!exercise.images || exercise.images.length === 0) return "";
  return `${EXERCISE_IMAGE_BASE_URL}${exercise.images[0]}`;
}

async function loadExercises() {
  try {
    const response = await fetch(EXERCISE_JSON_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch exercises");
    }

    const exercises = await response.json();
    allExercises = exercises
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 80);

    populateMuscleFilter(allExercises);
    displayExercises(allExercises);
  } catch (error) {
    if (workoutExercisesContainer) {
      workoutExercisesContainer.innerHTML =
        `<p class="empty-state">Could not load exercises.</p>`;
    }
    console.error("Error loading exercises:", error);
  }
}

function populateMuscleFilter(exercises) {
  if (!exerciseMuscleFilter) return;

  const muscles = new Set();
  exercises.forEach((ex) => {
    (ex.primaryMuscles || []).forEach((m) => muscles.add(m));
  });

  exerciseMuscleFilter.innerHTML =
    `<option value="all">All Muscle Groups</option>` +
    [...muscles]
      .sort()
      .map((m) => `<option value="${m.toLowerCase()}">${m}</option>`)
      .join("");
}

function displayExercises(exercises) {
  if (!workoutExercisesContainer) return;

  workoutExercisesContainer.innerHTML = "";

  if (exercises.length === 0) {
    workoutExercisesContainer.innerHTML =
      `<p class="empty-state">No exercises found.</p>`;
    return;
  }

  exercises.forEach((exercise) => {
    const imageUrl = getExerciseImageUrl(exercise);
    const primaryMuscles =
      exercise.primaryMuscles?.length
        ? exercise.primaryMuscles.join(", ")
        : "N/A";

    const safeName = exercise.name.replace(/'/g, "\\'");

    workoutExercisesContainer.innerHTML += `
      <div class="card">
        ${
          imageUrl
            ? `<img src="${imageUrl}" alt="${exercise.name}" class="exercise-image" onerror="this.style.display='none';" />`
            : ""
        }
        <h3>${exercise.name}</h3>
        <p><strong>Category:</strong> ${exercise.category || "N/A"}</p>
        <p><strong>Primary Muscles:</strong> ${primaryMuscles}</p>
        <button class="btn-primary add-workout-btn" onclick="addExerciseToWorkout('${safeName}')">Add to Workout</button>
        <button class="btn-secondary add-workout-btn" onclick="addFavoriteExercise('${safeName}')">Add to Favorites</button>
      </div>
    `;
  });
}

function filterExercises() {
  const searchValue = exerciseSearchInput
    ? exerciseSearchInput.value.trim().toLowerCase()
    : "";

  const selectedMuscle = exerciseMuscleFilter
    ? exerciseMuscleFilter.value
    : "all";

  const filtered = allExercises.filter((ex) => {
    const matchesName = ex.name.toLowerCase().includes(searchValue);
    const matchesMuscle =
      selectedMuscle === "all" ||
      (ex.primaryMuscles || []).some(
        (m) => m.toLowerCase() === selectedMuscle
      );

    return matchesName && matchesMuscle;
  });

  displayExercises(filtered);
}

/* =========================
   8. WORKOUT BUILDER
========================= */
function addExerciseToWorkout(exerciseName) {
  const ex = allExercises.find((e) => e.name === exerciseName);
  if (!ex) return;

  currentWorkout.push({
    id: Date.now() + Math.random(),
    name: ex.name,
    category: ex.category || "N/A",
    level: ex.level || "N/A",
    primaryMuscles: ex.primaryMuscles || [],
    sets: 3,
    reps: 10,
    weight: 0
  });

  updateSelectedMuscles(ex.primaryMuscles || []);
  renderCurrentWorkout();
}

function renderCurrentWorkout() {
  if (!currentWorkoutContainer) return;

  currentWorkoutContainer.innerHTML = "";

  if (currentWorkout.length === 0) {
    currentWorkoutContainer.innerHTML =
      `<p class="empty-state">No exercises added yet.</p>`;
    return;
  }

  currentWorkout.forEach((item) => {
    currentWorkoutContainer.innerHTML += `
      <div class="workout-item-card">
        <div class="workout-item-top">
          <div>
            <h3>${item.name}</h3>
            <p class="muted-text">${item.category} • ${item.level}</p>
          </div>
          <button class="btn-secondary small-btn" onclick="removeWorkoutItem(${item.id})">Remove</button>
        </div>
        <div class="workout-input-grid">
          <div>
            <label>Sets</label>
            <input type="number" min="1" value="${item.sets}" onchange="updateWorkoutItem(${item.id}, 'sets', this.value)" />
          </div>
          <div>
            <label>Reps</label>
            <input type="number" min="1" value="${item.reps}" onchange="updateWorkoutItem(${item.id}, 'reps', this.value)" />
          </div>
          <div>
            <label>Weight (lbs)</label>
            <input type="number" min="0" value="${item.weight}" onchange="updateWorkoutItem(${item.id}, 'weight', this.value)" />
          </div>
        </div>
      </div>
    `;
  });
}

function updateWorkoutItem(itemId, field, value) {
  const item = currentWorkout.find((i) => i.id === itemId);
  if (item) {
    item[field] = Number(value);
  }
}

function removeWorkoutItem(itemId) {
  currentWorkout = currentWorkout.filter((i) => i.id !== itemId);
  renderCurrentWorkout();

  if (currentWorkout.length === 0) {
    if (selectedMusclesText) {
      selectedMusclesText.textContent =
        "Select an exercise to highlight muscle groups.";
    }
    clearBodyHighlights();
  }
}

function clearWorkout() {
  currentWorkout = [];
  renderCurrentWorkout();

  if (selectedMusclesText) {
    selectedMusclesText.textContent =
      "Select an exercise to highlight muscle groups.";
  }

  clearBodyHighlights();
}

function updateSelectedMuscles(muscles) {
  if (!selectedMusclesText) return;

  if (!muscles || muscles.length === 0) {
    selectedMusclesText.textContent = "No muscle data available.";
    clearBodyHighlights();
    return;
  }

  selectedMusclesText.textContent = `Primary muscles: ${muscles.join(", ")}`;
  highlightMuscleParts(muscles);
}

/* =========================
   9. DATA PERSISTENCE & REWARDS
========================= */
function saveWorkout() {
  const user = getCurrentUser();

  if (!user) {
    alert("Please log in first to save workouts.");
    return;
  }

  if (currentWorkout.length === 0) {
    alert("Add at least one exercise before saving.");
    return;
  }

  const profileKey = `profile_${user.username}`;
  const profileData = JSON.parse(localStorage.getItem(profileKey)) || {};
  const oldXp = profileData.totalXp || 0;

  const totalSets = currentWorkout.reduce(
    (sum, item) => sum + (item.sets || 0),
    0
  );
  const xpGained = totalSets * GAMIFICATION_CONFIG.POINTS_PER_SET;

  const newXp = oldXp + xpGained;
  const oldLevel = GamificationService.calculateLevel(oldXp);
  const newLevel = GamificationService.calculateLevel(newXp);

  const storageKey = getUserStorageKey("savedWorkouts");
  const savedWorkouts = JSON.parse(localStorage.getItem(storageKey)) || [];

  savedWorkouts.push({
    id: Date.now(),
    date: new Date().toLocaleString(),
    durationSeconds: workoutSeconds,
    exercises: [...currentWorkout]
  });

  profileData.totalXp = newXp;

  localStorage.setItem(profileKey, JSON.stringify(profileData));
  localStorage.setItem(storageKey, JSON.stringify(savedWorkouts));

  alert(`Workout saved! Total Sets: ${totalSets}. +${xpGained} XP earned.`);

  if (newLevel > oldLevel) {
    triggerRewardToast(newLevel);
  }

  clearWorkout();
  resetWorkoutTimer();
  updateGamificationUI();
}

function addFavoriteExercise(exerciseName) {
  const user = getCurrentUser();

  if (!user) {
    alert("Please log in to save favorites.");
    return;
  }

  const ex = allExercises.find((e) => e.name === exerciseName);
  if (!ex) return;

  const key = getUserStorageKey("favoriteExercises");
  let favs = JSON.parse(localStorage.getItem(key)) || [];

  if (favs.some((f) => f.name === exerciseName)) {
    alert("Already in favorites.");
    return;
  }

  favs.push(ex);
  localStorage.setItem(key, JSON.stringify(favs));
  alert(`${ex.name} added to favorites.`);
}

/* =========================
   10. EVENT LISTENERS
========================= */
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "../index.html";
  });
}

if (exerciseSearchInput) {
  exerciseSearchInput.addEventListener("input", filterExercises);
}

if (exerciseMuscleFilter) {
  exerciseMuscleFilter.addEventListener("change", filterExercises);
}

if (startWorkoutTimerBtn) {
  startWorkoutTimerBtn.addEventListener("click", startWorkoutTimer);
}

if (pauseWorkoutTimerBtn) {
  pauseWorkoutTimerBtn.addEventListener("click", pauseWorkoutTimer);
}

if (resetWorkoutTimerBtn) {
  resetWorkoutTimerBtn.addEventListener("click", resetWorkoutTimer);
}

if (startRestTimerBtn) {
  startRestTimerBtn.addEventListener("click", startRestTimer);
}

if (pauseRestTimerBtn) {
  pauseRestTimerBtn.addEventListener("click", pauseRestTimer);
}

if (resetRestTimerBtn) {
  resetRestTimerBtn.addEventListener("click", resetRestTimer);
}

document.querySelectorAll(".restPresetBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    setRestPreset(Number(btn.dataset.seconds));
  });
});

if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener("click", saveWorkout);
}

if (clearWorkoutBtn) {
  clearWorkoutBtn.addEventListener("click", clearWorkout);
}

window.addExerciseToWorkout = addExerciseToWorkout;
window.addFavoriteExercise = addFavoriteExercise;
window.removeWorkoutItem = removeWorkoutItem;
window.updateWorkoutItem = updateWorkoutItem;

/* =========================
   11. INITIALIZATION
========================= */
updateUserStatus();
updateWorkoutTimerDisplay();
updateRestTimerDisplay();
renderCurrentWorkout();
loadExercises();