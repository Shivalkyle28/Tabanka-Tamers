const foodsContainer = document.getElementById("foodsContainer");
const exercisesContainer = document.getElementById("exercisesContainer");

let allFoods = [];
let allExercises = [];

/* Get current logged-in user */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

/* Build a per-user storage key */
function getUserStorageKey(baseKey) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  return `${baseKey}_${currentUser.username}`;
}

/* Load Caribbean foods from local JSON file */
async function loadFoods() {
  try {
    const response = await fetch("data/caribbean-foods.json");
    const foods = await response.json();

    allFoods = foods;
    displayFoods(foods);
  } catch (error) {
    console.error("Error loading foods:", error);
    foodsContainer.innerHTML = "<p>Could not load foods.</p>";
  }
}

/* Display food cards */
function displayFoods(foods) {
  foodsContainer.innerHTML = "";

  foods.forEach(food => {
    foodsContainer.innerHTML += `
      <div class="card">
        <h3>${food.name}</h3>
        <p><strong>Calories:</strong> ${food.calories} kcal</p>
        <p><strong>Protein:</strong> ${food.protein} g</p>
        <p><strong>Carbs:</strong> ${food.carbs} g</p>
        <p><strong>Fat:</strong> ${food.fat} g</p>
        <button class="btn-primary" onclick="addFavoriteFood(${food.id})">
          Add to Favorites
        </button>
      </div>
    `;
  });
}

/* Load exercises from GitHub-hosted JSON */
async function loadExercises() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json");
    const exercises = await response.json();

    allExercises = exercises;

    const featuredExercises = exercises.slice(0, 6);
    displayExercises(featuredExercises);
  } catch (error) {
    console.error("Error loading exercises:", error);
    exercisesContainer.innerHTML = "<p>Could not load exercises.</p>";
  }
}

/* Display exercise cards */
function displayExercises(exercises) {
  exercisesContainer.innerHTML = "";

  exercises.forEach(exercise => {
    exercisesContainer.innerHTML += `
      <div class="card">
        <h3>${exercise.name}</h3>
        <p><strong>Category:</strong> ${exercise.category}</p>
        <p><strong>Level:</strong> ${exercise.level}</p>
        <p><strong>Primary Muscles:</strong> ${exercise.primaryMuscles.join(", ")}</p>
        <button class="btn-primary" onclick="addFavoriteExercise('${exercise.name.replace(/'/g, "\\'")}')">
          Add to Favorites
        </button>
      </div>
    `;
  });
}

/* Add selected food to logged-in user's favorites */
function addFavoriteFood(foodId) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Please log in to save favorites.");
    return;
  }

  const selectedFood = allFoods.find(food => food.id === foodId);

  if (!selectedFood) {
    alert("Food not found.");
    return;
  }

  const storageKey = getUserStorageKey("favoriteFoods");
  let favoriteFoods = JSON.parse(localStorage.getItem(storageKey)) || [];

  const alreadyExists = favoriteFoods.some(food => food.id === foodId);

  if (alreadyExists) {
    alert("This food is already in your favorites.");
    return;
  }

  favoriteFoods.push(selectedFood);
  localStorage.setItem(storageKey, JSON.stringify(favoriteFoods));

  alert(`${selectedFood.name} added to favorites.`);
}

/* Add selected exercise to logged-in user's favorites */
function addFavoriteExercise(exerciseName) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Please log in to save favorites.");
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
let deferredPrompt = null;

const installBtn = document.getElementById("installAppBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) {
    alert("Install not available yet. Try using Chrome or refreshing the page.");
    return;
  }

  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;

  if (choice.outcome === "accepted") {
    console.log("App installed");
  }

  deferredPrompt = null;
});

window.addEventListener("appinstalled", () => {
  console.log("Installed successfully");
});
/* Start loading data when page opens */
loadFoods();
loadExercises();