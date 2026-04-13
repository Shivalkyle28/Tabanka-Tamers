const nutritionCardsContainer = document.getElementById("nutritionCardsContainer");
const paginationContainer = document.getElementById("paginationContainer");

const recipeSearchInput = document.getElementById("recipeSearchInput");
const recipeSearchBtn = document.getElementById("recipeSearchBtn");
const chipButtons = document.querySelectorAll(".chip-btn");

const recipeModal = document.getElementById("recipeModal");
const recipeModalBody = document.getElementById("recipeModalBody");
const closeRecipeModal = document.getElementById("closeRecipeModal");

const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

const categoryFilter = document.getElementById("categoryFilter");
const maxCaloriesFilter = document.getElementById("maxCaloriesFilter");
const minProteinFilter = document.getElementById("minProteinFilter");
const maxCarbsFilter = document.getElementById("maxCarbsFilter");
const maxFatFilter = document.getElementById("maxFatFilter");
const minFiberFilter = document.getElementById("minFiberFilter");
const maxSugarFilter = document.getElementById("maxSugarFilter");
const maxSodiumFilter = document.getElementById("maxSodiumFilter");

const toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
const filterDropdown = document.getElementById("filterDropdown");

/* =========================
   STATE
========================= */
let allRecipes = [];
let filteredRecipes = [];
let currentPage = 1;
const itemsPerPage = 6;
let activeFilter = "all";

/* =========================
   USER
========================= */
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

    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
    }
  } else {
    userStatus.textContent = "Guest";
    userStatus.classList.remove("clickable-user");
    userStatus.onclick = null;

    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
  }
}

/* =========================
   DATA
========================= */
function buildTags(item) {
  const tags = Array.isArray(item.tags) ? [...item.tags] : [];

  if (!tags.includes("Caribbean")) {
    tags.unshift("Caribbean");
  }

  if (Number(item.protein_g || 0) >= 20 && !tags.includes("High Protein")) {
    tags.push("High Protein");
  }

  if (Number(item.carbs_g || 0) <= 25 && !tags.includes("Low Carb")) {
    tags.push("Low Carb");
  }

  return tags;
}

async function loadRecipes() {
  try {
    const response = await fetch("../data/caribbean-foods.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    allRecipes = data.map(item => ({
      ...item,
      category: item.category || "Other",
      tags: buildTags(item),
      image: item.image || "../assets/foods/placeholder.jpg",
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : []
    }));

    filteredRecipes = [...allRecipes];
    renderRecipes();
    renderPagination();
  } catch (error) {
    console.error("Error loading recipes:", error);
    nutritionCardsContainer.innerHTML =
      `<p class="empty-state">Could not load recipes.</p>`;
    paginationContainer.innerHTML = "";
  }
}

/* =========================
   FAVORITES + DAILY LOG
========================= */
function addFavoriteFood(id) {
  const user = getCurrentUser();

  if (!user) {
    alert("Please log in to save favorite foods.");
    return;
  }

  const recipe = allRecipes.find(item => item.id === id);
  if (!recipe) return;

  const key = getUserStorageKey("favoriteFoods");
  const favorites = JSON.parse(localStorage.getItem(key)) || [];

  if (favorites.some(item => item.id === id)) {
    alert("This recipe is already in your favorites.");
    return;
  }

  favorites.push(recipe);
  localStorage.setItem(key, JSON.stringify(favorites));
  alert(`${recipe.name} added to favorites.`);
}

function addFoodToToday(id) {
  const user = getCurrentUser();

  if (!user) {
    alert("Please log in to track nutrition.");
    return;
  }

  const recipe = allRecipes.find(item => item.id === id);
  if (!recipe) return;

  const key = getUserStorageKey("dailyNutritionLog");
  const log = JSON.parse(localStorage.getItem(key)) || [];
  const today = new Date().toISOString().split("T")[0];

  log.push({
    entryId: Date.now(),
    date: today,
    foodId: recipe.id,
    name: recipe.name,
    calories: Number(recipe.calories || 0),
    protein_g: Number(recipe.protein_g || 0),
    carbs_g: Number(recipe.carbs_g || 0),
    fat_g: Number(recipe.fat_g || 0),
    fiber_g: Number(recipe.fiber_g || 0),
    sugar_g: Number(recipe.sugar_g || 0),
    sodium_mg: Number(recipe.sodium_mg || 0)
  });

  localStorage.setItem(key, JSON.stringify(log));
  alert(`${recipe.name} added to today's log.`);
}

/* =========================
   FILTERING
========================= */
function applyFilters() {
  const searchValue = recipeSearchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  const maxCalories = maxCaloriesFilter.value ? Number(maxCaloriesFilter.value) : Infinity;
  const minProtein = minProteinFilter.value ? Number(minProteinFilter.value) : 0;
  const maxCarbs = maxCarbsFilter.value ? Number(maxCarbsFilter.value) : Infinity;
  const maxFat = maxFatFilter.value ? Number(maxFatFilter.value) : Infinity;
  const minFiber = minFiberFilter.value ? Number(minFiberFilter.value) : 0;
  const maxSugar = maxSugarFilter.value ? Number(maxSugarFilter.value) : Infinity;
  const maxSodium = maxSodiumFilter.value ? Number(maxSodiumFilter.value) : Infinity;

  filteredRecipes = allRecipes.filter(recipe => {
    const searchableIngredients = recipe.ingredients.join(" ").toLowerCase();
    const searchableTags = recipe.tags.join(" ").toLowerCase();

    const matchesSearch =
      recipe.name.toLowerCase().includes(searchValue) ||
      recipe.description.toLowerCase().includes(searchValue) ||
      searchableIngredients.includes(searchValue) ||
      searchableTags.includes(searchValue);

    const matchesCategory =
      selectedCategory === "all" || recipe.category === selectedCategory;

    const matchesNutrition =
      Number(recipe.calories || 0) <= maxCalories &&
      Number(recipe.protein_g || 0) >= minProtein &&
      Number(recipe.carbs_g || 0) <= maxCarbs &&
      Number(recipe.fat_g || 0) <= maxFat &&
      Number(recipe.fiber_g || 0) >= minFiber &&
      Number(recipe.sugar_g || 0) <= maxSugar &&
      Number(recipe.sodium_mg || 0) <= maxSodium;

    const matchesChip =
      activeFilter === "all" ||
      (activeFilter === "protein" && Number(recipe.protein_g || 0) >= 20) ||
      (activeFilter === "lowcarb" && Number(recipe.carbs_g || 0) <= 25);

    return matchesSearch && matchesCategory && matchesNutrition && matchesChip;
  });

  currentPage = 1;
  renderRecipes();
  renderPagination();
}

/* =========================
   RENDER RECIPES
========================= */
function renderRecipes() {
  nutritionCardsContainer.innerHTML = "";

  if (filteredRecipes.length === 0) {
    nutritionCardsContainer.innerHTML =
      `<p class="empty-state">No recipes found.</p>`;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredRecipes.slice(startIndex, startIndex + itemsPerPage);

  currentItems.forEach(recipe => {
    nutritionCardsContainer.innerHTML += `
      <article class="recipe-card" onclick="openRecipeModal(${recipe.id})">
        <img
          src="${recipe.image}"
          alt="${recipe.name}"
          class="recipe-image"
          onerror="this.src='../assets/foods/placeholder.jpg';"
        />

        <div class="recipe-card-body">
          <h3>${recipe.name}</h3>
          <p class="recipe-tags">${recipe.tags.join(" • ")}</p>
          <div class="recipe-macro-preview">
            <span>Cals: ${recipe.calories}</span>
            <span>P: ${recipe.protein_g}g</span>
            <span>C: ${recipe.carbs_g}g</span>
            <span>F: ${recipe.fat_g}g</span>
          </div>
        </div>
      </article>
    `;
  });
}

function renderPagination() {
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
  if (totalPages <= 1) return;

  for (let page = 1; page <= totalPages; page++) {
    paginationContainer.innerHTML += `
      <button
        class="pagination-btn ${page === currentPage ? "active-page" : ""}"
        onclick="goToPage(${page})"
        type="button"
      >
        ${page}
      </button>
    `;
  }
}

function goToPage(page) {
  currentPage = page;
  renderRecipes();
  renderPagination();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================
   MODAL
========================= */
function openRecipeModal(id) {
  const recipe = allRecipes.find(item => item.id === id);
  if (!recipe) return;

  const user = getCurrentUser();

  recipeModalBody.innerHTML = `
    <img
      src="${recipe.image}"
      alt="${recipe.name}"
      class="recipe-detail-image"
      onerror="this.src='../assets/foods/placeholder.jpg';"
    />

    <h2>${recipe.name}</h2>
    <p class="muted-text">${recipe.description || ""}</p>
    <p class="muted-text"><strong>Serving Size:</strong> ${recipe.serving_size || "N/A"}</p>
    <p class="recipe-tags">${recipe.tags.join(" • ")}</p>

    <div class="recipe-detail-grid">
      <div class="recipe-detail-stat">
        <strong>${recipe.calories || 0}</strong>
        <span>Calories</span>
      </div>
      <div class="recipe-detail-stat">
        <strong>${recipe.protein_g || 0}g</strong>
        <span>Protein</span>
      </div>
      <div class="recipe-detail-stat">
        <strong>${recipe.carbs_g || 0}g</strong>
        <span>Carbs</span>
      </div>
      <div class="recipe-detail-stat">
        <strong>${recipe.fat_g || 0}g</strong>
        <span>Fat</span>
      </div>
      <div class="recipe-detail-stat">
        <strong>${recipe.fiber_g || 0}g</strong>
        <span>Fiber</span>
      </div>
      <div class="recipe-detail-stat">
        <strong>${recipe.sugar_g || 0}g</strong>
        <span>Sugar</span>
      </div>
      <div class="recipe-detail-stat">
        <strong>${recipe.sodium_mg || 0}mg</strong>
        <span>Sodium</span>
      </div>
    </div>

    <div class="recipe-detail-text">
      <h3>Ingredients</h3>
      <ul class="recipe-ingredients-list">
        ${
          recipe.ingredients.length
            ? recipe.ingredients.map(item => `<li>${item}</li>`).join("")
            : "<li>No ingredients available.</li>"
        }
      </ul>
    </div>

    ${
      user
        ? `
          <div class="landing-actions" style="margin-top: 20px;">
            <button class="btn-secondary" type="button" onclick="addFavoriteFood(${recipe.id})">
              Favorite
            </button>
            <button class="btn-primary" type="button" onclick="addFoodToToday(${recipe.id})">
              Add to Log
            </button>
          </div>
        `
        : `
          <p class="muted-text" style="margin-top: 18px;">
            Log in to save favorites and track this meal in your daily nutrition log.
          </p>
        `
    }
  `;

  recipeModal.classList.remove("hidden");
}

function closeModal() {
  recipeModal.classList.add("hidden");
}

/* =========================
   EVENTS
========================= */
recipeSearchBtn.addEventListener("click", applyFilters);
recipeSearchInput.addEventListener("input", applyFilters);

[
  categoryFilter,
  maxCaloriesFilter,
  minProteinFilter,
  maxCarbsFilter,
  maxFatFilter,
  minFiberFilter,
  maxSugarFilter,
  maxSodiumFilter
].forEach(control => {
  control.addEventListener("input", applyFilters);
  control.addEventListener("change", applyFilters);
});

chipButtons.forEach(button => {
  button.addEventListener("click", () => {
    chipButtons.forEach(btn => btn.classList.remove("active-chip"));
    button.classList.add("active-chip");
    activeFilter = button.dataset.filter;
    applyFilters();
  });
});

toggleFiltersBtn.addEventListener("click", () => {
  filterDropdown.classList.toggle("hidden");
  toggleFiltersBtn.textContent = filterDropdown.classList.contains("hidden")
    ? "Advanced Filters ▼"
    : "Advanced Filters ▲";
});

closeRecipeModal.addEventListener("click", closeModal);

recipeModal.addEventListener("click", event => {
  if (event.target === recipeModal) {
    closeModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !recipeModal.classList.contains("hidden")) {
    closeModal();
  }
});

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
});

/* =========================
   INIT
========================= */
updateUserStatus();
loadRecipes();