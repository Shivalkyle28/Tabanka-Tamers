const frontBodySvg = document.getElementById("frontBodySvg");
const backBodySvg = document.getElementById("backBodySvg");

const workoutExercisesContainer = document.getElementById("workoutExercisesContainer");
const currentWorkoutContainer = document.getElementById("currentWorkoutContainer");
const selectedMusclesText = document.getElementById("selectedMusclesText");

const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

const exerciseSearchInput = document.getElementById("exerciseSearchInput");
const exerciseLevelFilter = document.getElementById("exerciseLevelFilter");
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

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getUserStorageKey(baseKey) {
  const user = getCurrentUser();
  return user ? `${baseKey}_${user.username}` : null;
}

function updateUserStatus() {
  const user = getCurrentUser();

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

function clearBodyHighlights() {
  [frontBodySvg, backBodySvg].forEach(svgObject => {
    if (!svgObject || !svgObject.contentDocument) return;

    const activeParts = svgObject.contentDocument.querySelectorAll(".muscle");
    activeParts.forEach(part => {
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

  muscles.forEach(muscle => {
    const normalized = muscle.toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
    const ids = muscleMap[normalized] || [];

    svgDocs.forEach(doc => {
      if (!doc) return;

      ids.forEach(id => {
        const el = doc.getElementById(id);
        if (el) {
          el.classList.remove("inactive");
          el.classList.add("active");
        }
      });
    });
  });
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateWorkoutTimerDisplay() {
  workoutTimerDisplay.textContent = formatTime(workoutSeconds);
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
  restTimerDisplay.textContent = formatTime(restTimeRemaining);
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

function sortExercisesByLevel(exercises) {
  const levelOrder = {
    beginner: 1,
    intermediate: 2,
    expert: 3
  };

  return [...exercises].sort((a, b) => {
    const levelA = levelOrder[a.level?.toLowerCase()] || 999;
    const levelB = levelOrder[b.level?.toLowerCase()] || 999;

    if (levelA !== levelB) {
      return levelA - levelB;
    }

    return a.name.localeCompare(b.name);
  });
}

async function loadExercises() {
  try {
    const response = await fetch(EXERCISE_JSON_URL);
    const exercises = await response.json();

    allExercises = sortExercisesByLevel(exercises).slice(0, 80);
    populateMuscleFilter(allExercises);
    displayExercises(allExercises);
  } catch (error) {
    console.error("Error loading exercises:", error);
    workoutExercisesContainer.innerHTML = `<p class="empty-state">Could not load exercises.</p>`;
  }
}

function populateMuscleFilter(exercises) {
  if (!exerciseMuscleFilter) return;

  const muscles = new Set();

  exercises.forEach(exercise => {
    (exercise.primaryMuscles || []).forEach(muscle => muscles.add(muscle));
  });

  const sortedMuscles = [...muscles].sort((a, b) => a.localeCompare(b));

  exerciseMuscleFilter.innerHTML = `<option value="all">All Muscle Groups</option>`;

  sortedMuscles.forEach(muscle => {
    exerciseMuscleFilter.innerHTML += `<option value="${muscle.toLowerCase()}">${muscle}</option>`;
  });
}

function getExerciseImageUrl(exercise) {
  if (!exercise.images || exercise.images.length === 0) {
    return "";
  }

  return `${EXERCISE_IMAGE_BASE_URL}${exercise.images[0]}`;
}

function addFavoriteExercise(exerciseName) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Please log in to save favorite exercises.");
    return;
  }

  const selectedExercise = allExercises.find(exercise => exercise.name === exerciseName);

  if (!selectedExercise) {
    alert("Exercise not found.");
    return;
  }

  const storageKey = getUserStorageKey("favoriteExercises");
  let favoriteExercises = JSON.parse(localStorage.getItem(storageKey)) || [];

  const alreadyExists = favoriteExercises.some(exercise => exercise.name === exerciseName);

  if (alreadyExists) {
    alert("This exercise is already in your favorites.");
    return;
  }

  favoriteExercises.push(selectedExercise);
  localStorage.setItem(storageKey, JSON.stringify(favoriteExercises));

  alert(`${selectedExercise.name} added to favorites.`);
}

function displayExercises(exercises) {
  workoutExercisesContainer.innerHTML = "";

  if (exercises.length === 0) {
    workoutExercisesContainer.innerHTML = `<p class="empty-state">No exercises found.</p>`;
    return;
  }

  exercises.forEach(exercise => {
    const imageUrl = getExerciseImageUrl(exercise);
    const primaryMuscles = exercise.primaryMuscles?.length
      ? exercise.primaryMuscles.join(", ")
      : "N/A";

    const safeName = exercise.name.replace(/'/g, "\\'");

    workoutExercisesContainer.innerHTML += `
      <div class="card">
        ${
          imageUrl
            ? `<img
                src="${imageUrl}"
                alt="${exercise.name}"
                class="exercise-image"
                onerror="this.style.display='none';"
              />`
            : ""
        }
        <h3>${exercise.name}</h3>
        <p><strong>Category:</strong> ${exercise.category || "N/A"}</p>
        <p><strong>Level:</strong> ${exercise.level || "N/A"}</p>
        <p><strong>Primary Muscles:</strong> ${primaryMuscles}</p>

        <button class="btn-primary add-workout-btn" onclick="addExerciseToWorkout('${safeName}')">
          Add to Workout
        </button>

        <button class="btn-secondary add-workout-btn" onclick="addFavoriteExercise('${safeName}')">
          Add to Favorites
        </button>
      </div>
    `;
  });
}

function filterExercises() {
  const searchValue = exerciseSearchInput.value.trim().toLowerCase();
  const selectedLevel = exerciseLevelFilter.value;
  const selectedMuscle = exerciseMuscleFilter.value;

  const filteredExercises = allExercises.filter(exercise => {
    const matchesName = exercise.name.toLowerCase().includes(searchValue);

    const matchesLevel =
      selectedLevel === "all" ||
      (exercise.level && exercise.level.toLowerCase() === selectedLevel);

    const matchesMuscle =
      selectedMuscle === "all" ||
      (exercise.primaryMuscles || []).some(
        muscle => muscle.toLowerCase() === selectedMuscle
      );

    return matchesName && matchesLevel && matchesMuscle;
  });

  displayExercises(filteredExercises);
}

function addExerciseToWorkout(exerciseName) {
  const selectedExercise = allExercises.find(exercise => exercise.name === exerciseName);

  if (!selectedExercise) {
    alert("Exercise not found.");
    return;
  }

  currentWorkout.push({
    id: Date.now() + Math.random(),
    name: selectedExercise.name,
    category: selectedExercise.category || "N/A",
    level: selectedExercise.level || "N/A",
    primaryMuscles: selectedExercise.primaryMuscles || [],
    sets: 3,
    reps: 10,
    weight: 0
  });

  updateSelectedMuscles(selectedExercise.primaryMuscles || []);
  renderCurrentWorkout();

  document.querySelector(".section-header h2")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function renderCurrentWorkout() {
  currentWorkoutContainer.innerHTML = "";

  if (currentWorkout.length === 0) {
    currentWorkoutContainer.innerHTML = `<p class="empty-state">No exercises added yet.</p>`;
    return;
  }

  currentWorkout.forEach(item => {
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
            <input
              type="number"
              min="1"
              value="${item.sets}"
              onchange="updateWorkoutItem(${item.id}, 'sets', this.value)"
            />
          </div>

          <div>
            <label>Reps</label>
            <input
              type="number"
              min="1"
              value="${item.reps}"
              onchange="updateWorkoutItem(${item.id}, 'reps', this.value)"
            />
          </div>

          <div>
            <label>Weight (lbs)</label>
            <input
              type="number"
              min="0"
              value="${item.weight}"
              onchange="updateWorkoutItem(${item.id}, 'weight', this.value)"
            />
          </div>
        </div>
      </div>
    `;
  });
}

function updateWorkoutItem(itemId, field, value) {
  const item = currentWorkout.find(workoutItem => workoutItem.id === itemId);
  if (!item) return;
  item[field] = Number(value);
}

function removeWorkoutItem(itemId) {
  currentWorkout = currentWorkout.filter(item => item.id !== itemId);
  renderCurrentWorkout();

  if (currentWorkout.length === 0) {
    selectedMusclesText.textContent = "Select an exercise to view its main muscle groups.";
    clearBodyHighlights();
  }
}

function clearWorkout() {
  currentWorkout = [];
  renderCurrentWorkout();
  selectedMusclesText.textContent = "Select an exercise to view its main muscle groups.";
  clearBodyHighlights();
}

function updateSelectedMuscles(muscles) {
  if (!muscles || muscles.length === 0) {
    selectedMusclesText.textContent = "No muscle data available for this exercise.";
    clearBodyHighlights();
    return;
  }

  selectedMusclesText.textContent = `Primary muscles: ${muscles.join(", ")}`;
  highlightMuscleParts(muscles);
}

function saveWorkout() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Please log in first to save workouts.");
    return;
  }

  if (currentWorkout.length === 0) {
    alert("Add at least one exercise before saving.");
    return;
  }

  const storageKey = getUserStorageKey("savedWorkouts");
  const savedWorkouts = JSON.parse(localStorage.getItem(storageKey)) || [];

  const newWorkout = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    durationSeconds: workoutSeconds,
    exercises: [...currentWorkout]
  };

  savedWorkouts.push(newWorkout);
  localStorage.setItem(storageKey, JSON.stringify(savedWorkouts));

  alert("Workout saved successfully.");

  clearWorkout();
  resetWorkoutTimer();
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "../index.html";
  });
}

if (exerciseSearchInput) {
  exerciseSearchInput.addEventListener("input", filterExercises);
}

if (exerciseLevelFilter) {
  exerciseLevelFilter.addEventListener("change", filterExercises);
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

document.querySelectorAll(".restPresetBtn").forEach(button => {
  button.addEventListener("click", function () {
    const seconds = Number(this.dataset.seconds);
    setRestPreset(seconds);
  });
});

if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener("click", saveWorkout);
}

if (clearWorkoutBtn) {
  clearWorkoutBtn.addEventListener("click", clearWorkout);
}

updateUserStatus();
updateWorkoutTimerDisplay();
updateRestTimerDisplay();
renderCurrentWorkout();
loadExercises();