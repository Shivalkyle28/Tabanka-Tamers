const container = document.getElementById("nutritionContainer");
const searchInput = document.getElementById("searchInput");

let foods = [];
let filteredFoods = [];
let activeFilter = "all";

async function loadFoods() {
  const res = await fetch("../data/caribbean-foods.json");
  foods = await res.json();

  filteredFoods = [...foods];
  renderFoods();
}

function renderFoods() {
  container.innerHTML = "";

  if (filteredFoods.length === 0) {
    container.innerHTML = `<p class="empty-state">No recipes found</p>`;
    return;
  }

  filteredFoods.forEach(food => {
    container.innerHTML += `
      <div class="recipe-card">

        <div class="recipe-image-placeholder"></div>

        <div class="recipe-card-body">
          <h3>${food.name}</h3>

          <p class="recipe-tags">
            ${getTags(food).join(" • ")}
          </p>

          <div class="recipe-macro-preview">
            <span>P: ${food.protein}g</span>
            <span>C: ${food.carbs}g</span>
            <span>F: ${food.fat}g</span>
          </div>

        </div>
      </div>
    `;
  });
}

function getTags(food) {
  let tags = ["Caribbean"];

  if (food.protein >= 20) tags.push("High Protein");
  if (food.carbs <= 25) tags.push("Low Carb");

  return tags;
}

function applyFilters() {
  const search = searchInput.value.toLowerCase();

  filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search);

    let matchesFilter = true;

    if (activeFilter === "protein") {
      matchesFilter = food.protein >= 20;
    }

    if (activeFilter === "lowcarb") {
      matchesFilter = food.carbs <= 25;
    }

    return matchesSearch && matchesFilter;
  });

  renderFoods();
}

searchInput.addEventListener("input", applyFilters);

document.querySelectorAll(".chip-btn").forEach(btn => {
  btn.addEventListener("click", function () {

    document.querySelectorAll(".chip-btn")
      .forEach(b => b.classList.remove("active-chip"));

    this.classList.add("active-chip");
    activeFilter = this.dataset.filter;

    applyFilters();
  });
});

loadFoods();