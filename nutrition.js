const nutritionCardsContainer = document.getElementById("nutritionCardsContainer");
const paginationContainer = document.getElementById("paginationContainer");

const recipeSearchInput = document.getElementById("recipeSearchInput");
const recipeSearchBtn = document.getElementById("recipeSearchBtn");
const chipButtons = document.querySelectorAll(".chip-btn");

const recipeModal = document.getElementById("recipeModal");
const recipeModalBody = document.getElementById("recipeModalBody");
const closeRecipeModal = document.getElementById("closeRecipeModal");

const userStatus = document.getElementById("userStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

let allRecipes = [];
let filteredRecipes = [];
let currentPage = 1;
const itemsPerPage = 6;
let activeFilter = "all";

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getUserStorageKey(baseKey) {
  const currentUser = getCurrentUser();
  return currentUser ? `${baseKey}_${currentUser.username}` : null;
}

function updateUserStatus() {
  const currentUser = getCurrentUser();

  if (currentUser) {
    if (userStatus) {
      userStatus.textContent = currentUser.username;
      userStatus.classList.add("clickable-user");
      userStatus.onclick = function () {
        window.location.href = "profile.html";
      };
    }

    if (loginBtn) {
      loginBtn.textContent = currentUser.username;
      loginBtn.onclick = function () {
        window.location.href = "profile.html";
      };
    }

    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
    }
  } else {
    if (userStatus) {
      userStatus.textContent = "Guest";
      userStatus.classList.remove("clickable-user");
      userStatus.onclick = null;
    }

    if (loginBtn) {
      loginBtn.textContent = "Login";
      loginBtn.onclick = function () {
        window.location.href = "auth.html";
      };
    }

    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
  }
}

async function loadRecipes() {
  try {
    const response = await fetch("../data/caribbean-foods.json");
    const data = await response.json();

    allRecipes = data.map(item => ({
      ...item,
      category: item.category || "Caribbean",
      tags: Array.isArray(item.tags) ? item.tags : buildTags(item)
    }));

    filteredRecipes = [...allRecipes];
    renderRecipes();
    renderPagination();
  } catch (error) {
    console.error("Error loading recipes:", error);
    nutritionCardsContainer.innerHTML = `<p class="empty-state">Could not load recipes.</p>`;
  }
}

function buildTags(item) {
  const tags = ["Caribbean"];

  if (Number(item.protein_g || 0) >= 20) {
    tags.push("High Protein");
  }

  if (Number(item.carbs_g || 0) <= 25) {
    tags.push("Low Carb");
  }

  return tags;
}

function addFavoriteFood(recipeId) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Log in to save favorite foods.");
    return;
  }

  const selectedRecipe = allRecipes.find(recipe => recipe.id === recipeId);

  if (!selectedRecipe) {
    alert("Recipe not found.");
    return;
  }

  const storageKey = getUserStorageKey("favoriteFoods");
  let favoriteFoods = JSON.parse(localStorage.getItem(storageKey)) || [];

  const alreadyExists = favoriteFoods.some(food => food.id === recipeId);

  if (alreadyExists) {
    alert("This food is already in your favorites.");
    return;
  }

  favoriteFoods.push(selectedRecipe);
  localStorage.setItem(storageKey, JSON.stringify(favoriteFoods));

  alert(`${selectedRecipe.name} added to favorites.`);
}

function addFoodToToday(recipeId) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Log in to track nutrition.");
    return;
  }

  const selectedRecipe = allRecipes.find(recipe => recipe.id === recipeId);

  if (!selectedRecipe) {
    alert("Recipe not found.");
    return;
  }

  const storageKey = getUserStorageKey("dailyNutritionLog");
  let dailyLog = JSON.parse(localStorage.getItem(storageKey)) || [];

  const today = new Date().toISOString().split("T")[0];

  dailyLog.push({
    entryId: Date.now(),
    date: today,
    foodId: selectedRecipe.id,
    name: selectedRecipe.name,
    calories: Number(selectedRecipe.calories || 0),
    protein_g: Number(selectedRecipe.protein_g || 0),
    carbs_g: Number(selectedRecipe.carbs_g || 0),
    fat_g: Number(selectedRecipe.fat_g || 0)
  });

  localStorage.setItem(storageKey, JSON.stringify(dailyLog));

  alert(`${selectedRecipe.name} added to today’s nutrition log.`);
}

function applyFilters() {
  const searchValue = recipeSearchInput.value.trim().toLowerCase();

  filteredRecipes = allRecipes.filter(recipe => {
    const ingredientText = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.join(" ").toLowerCase()
      : "";

    const matchesSearch =
      recipe.name.toLowerCase().includes(searchValue) ||
      (recipe.category || "").toLowerCase().includes(searchValue) ||
      (recipe.description || "").toLowerCase().includes(searchValue) ||
      ingredientText.includes(searchValue) ||
      (recipe.tags || []).some(tag => tag.toLowerCase().includes(searchValue));

    let matchesChip = true;

    if (activeFilter === "protein") {
      matchesChip = Number(recipe.protein_g || 0) >= 20;
    } else if (activeFilter === "lowcarb") {
      matchesChip = Number(recipe.carbs_g || 0) <= 25;
    }

    return matchesSearch && matchesChip;
  });

  currentPage = 1;
  renderRecipes();
  renderPagination();
}

function renderRecipes() {
  nutritionCardsContainer.innerHTML = "";

  if (filteredRecipes.length === 0) {
    nutritionCardsContainer.innerHTML = `<p class="empty-state">No recipes found.</p>`;
    return;
  }

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const recipesToShow = filteredRecipes.slice(start, end);

  recipesToShow.forEach(recipe => {
    nutritionCardsContainer.innerHTML += `
      <div class="recipe-card" onclick="openRecipeModal(${recipe.id})">
        <div class="recipe-image-placeholder"></div>

        <div class="recipe-card-body">
          <h3>${recipe.name}</h3>
          <p class="recipe-tags">${recipe.tags.join(" • ")}</p>
          <p class="muted-text">Click to view details</p>
        </div>
      </div>
    `;
  });
}

function renderPagination() {
  paginationContainer.innerHTML = "";

  const pageCount = Math.ceil(filteredRecipes.length / itemsPerPage);

  if (pageCount <= 1) {
    return;
  }

  for (let i = 1; i <= pageCount; i++) {
    paginationContainer.innerHTML += `
      <button class="pagination-btn ${i === currentPage ? "active-page" : ""}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }
}

function goToPage(page) {
  currentPage = page;
  renderRecipes();
  renderPagination();
}

function openRecipeModal(recipeId) {
  const recipe = allRecipes.find(item => item.id === recipeId);

  if (!recipe) {
    return;
  }

  const currentUser = getCurrentUser();

  const ingredientsHtml = Array.isArray(recipe.ingredients)
    ? `<ul class="recipe-ingredients-list">${recipe.ingredients.map(item => `<li>${item}</li>`).join("")}</ul>`
    : `<p class="muted-text">No ingredients listed.</p>`;

  const statsSection = currentUser
    ? `
      <div class="recipe-detail-grid">
        <div class="recipe-detail-stat">
          <strong>${recipe.calories}</strong>
          <span>Calories</span>
        </div>
        <div class="recipe-detail-stat">
          <strong>${recipe.protein_g}g</strong>
          <span>Protein</span>
        </div>
        <div class="recipe-detail-stat">
          <strong>${recipe.carbs_g}g</strong>
          <span>Carbs</span>
        </div>
        <div class="recipe-detail-stat">
          <strong>${recipe.fat_g}g</strong>
          <span>Fat</span>
        </div>
        <div class="recipe-detail-stat">
          <strong>${recipe.fiber_g}g</strong>
          <span>Fiber</span>
        </div>
        <div class="recipe-detail-stat">
          <strong>${recipe.sugar_g}g</strong>
          <span>Sugar</span>
        </div>
        <div class="recipe-detail-stat">
          <strong>${recipe.sodium_mg}mg</strong>
          <span>Sodium</span>
        </div>
        <div class="recipe-detail-stat">
          <strong>${recipe.serving_size}</strong>
          <span>Serving</span>
        </div>
      </div>

      <div class="landing-actions">
        <button class="btn-primary" onclick="addFavoriteFood(${recipe.id})">Add to Favorites</button>
        <button class="btn-secondary" onclick="addFoodToToday(${recipe.id})">Add to Today's Log</button>
      </div>
    `
    : `
      <div class="summary-card">
        <p class="muted-text">
          Log in to see full nutrition stats, save favorites, and track this food in your daily nutrition log.
        </p>
      </div>
    `;

  recipeModalBody.innerHTML = `
    <div class="recipe-detail-image"></div>
    <h2>${recipe.name}</h2>
    <p class="muted-text">${recipe.tags.join(" • ")}</p>
    <p class="muted-text">${recipe.description || ""}</p>

    ${statsSection}

    <h3>Ingredients</h3>
    ${ingredientsHtml}
  `;

  recipeModal.classList.remove("hidden");
}

function closeModal() {
  recipeModal.classList.add("hidden");
}

if (recipeSearchBtn) {
  recipeSearchBtn.addEventListener("click", applyFilters);
}

if (recipeSearchInput) {
  recipeSearchInput.addEventListener("input", applyFilters);
}

chipButtons.forEach(button => {
  button.addEventListener("click", function () {
    chipButtons.forEach(btn => btn.classList.remove("active-chip"));
    this.classList.add("active-chip");
    activeFilter = this.dataset.filter;
    applyFilters();
  });
});

if (closeRecipeModal) {
  closeRecipeModal.addEventListener("click", closeModal);
}

if (recipeModal) {
  recipeModal.addEventListener("click", function (event) {
    if (event.target === recipeModal) {
      closeModal();
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    logoutUser();
  });
}

updateUserStatus();
loadRecipes();