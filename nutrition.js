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

let allRecipes = [];
let filteredRecipes = [];
let currentPage = 1;
const itemsPerPage = 6;
let activeFilter = "all";

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function updateUserStatus() {
  const currentUser = getCurrentUser();

  if (currentUser) {
    userStatus.textContent = `Logged in as ${currentUser.username}`;
    loginBtn.textContent = currentUser.username;
    loginBtn.onclick = function () {
      window.location.href = "profile.html";
    };
  } else {
    userStatus.textContent = "Guest";
    loginBtn.textContent = "Login";
    loginBtn.onclick = function () {
      window.location.href = "auth.html";
    };
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

    if (activeFilter === "high-protein") {
      matchesChip = Number(recipe.protein_g || 0) >= 20;
    } else if (activeFilter === "low-carb") {
      matchesChip = Number(recipe.carbs_g || 0) <= 25;
    } else if (activeFilter === "caribbean") {
      matchesChip = true;
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

          <div class="recipe-macro-preview">
            <span>P: ${recipe.protein_g}g</span>
            <span>C: ${recipe.carbs_g}g</span>
            <span>F: ${recipe.fat_g}g</span>
          </div>
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

  const ingredientsHtml = Array.isArray(recipe.ingredients)
    ? `<ul class="recipe-ingredients-list">${recipe.ingredients.map(item => `<li>${item}</li>`).join("")}</ul>`
    : `<p class="muted-text">No ingredients listed.</p>`;

  recipeModalBody.innerHTML = `
    <div class="recipe-detail-image"></div>
    <h2>${recipe.name}</h2>
    <p class="muted-text">${recipe.tags.join(" • ")}</p>
    <p class="muted-text">${recipe.description || ""}</p>

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

    <h3>Ingredients</h3>
    ${ingredientsHtml}
  `;

  recipeModal.classList.remove("hidden");
}

function closeModal() {
  recipeModal.classList.add("hidden");
}

recipeSearchBtn.addEventListener("click", applyFilters);
recipeSearchInput.addEventListener("input", applyFilters);

chipButtons.forEach(button => {
  button.addEventListener("click", function () {
    chipButtons.forEach(btn => btn.classList.remove("active-chip"));
    this.classList.add("active-chip");
    activeFilter = this.dataset.filter;
    applyFilters();
  });
});

closeRecipeModal.addEventListener("click", closeModal);

recipeModal.addEventListener("click", function (event) {
  if (event.target === recipeModal) {
    closeModal();
  }
});

updateUserStatus();
loadRecipes();