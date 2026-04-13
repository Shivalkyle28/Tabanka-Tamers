const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

const strengthChart = document.getElementById("strengthChart");
const bodyweightChart = document.getElementById("bodyweightChart");
const macroChart = document.getElementById("macroChart");

const totalWorkoutsStat = document.getElementById("totalWorkoutsStat");
const avgCaloriesStat = document.getElementById("avgCaloriesStat");
const currentStreakStat = document.getElementById("currentStreakStat");

const targetCaloriesStat = document.getElementById("targetCaloriesStat");
const targetProteinStat = document.getElementById("targetProteinStat");
const targetCarbsStat = document.getElementById("targetCarbsStat");
const targetFatStat = document.getElementById("targetFatStat");

const filterButtons = document.querySelectorAll(".progress-filter-btn");

let selectedRangeDays = 7;

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

function protectPage() {
  if (!getCurrentUser()) {
    alert("You must be logged in to view this page.");
    window.location.href = "auth.html";
  }
}

function updateUserStatus() {
  const user = getCurrentUser();

  if (user) {
    userStatus.textContent = user.username;
    userStatus.classList.add("clickable-user");
    userStatus.onclick = () => window.location.href = "profile.html";
  } else {
    userStatus.textContent = "Guest";
    userStatus.classList.remove("clickable-user");
  }
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
}

/* =========================
   DATA
========================= */
function getSavedWorkouts() {
  return JSON.parse(localStorage.getItem(getUserStorageKey("savedWorkouts"))) || [];
}

function getNutritionLog() {
  return JSON.parse(localStorage.getItem(getUserStorageKey("dailyNutritionLog"))) || [];
}

function getProfile() {
  return JSON.parse(localStorage.getItem(getUserStorageKey("profile"))) || {};
}

/* =========================
   FILTERING
========================= */
function filterByRange(list, days) {
  const now = new Date();

  return list.filter(item => {
    const date = new Date(item.date);
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    return diff <= days;
  });
}

/* =========================
   CANVAS HELPERS
========================= */
function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = 320;
}

function drawEmptyChart(canvas, message) {
  const ctx = canvas.getContext("2d");
  resizeCanvas(canvas);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#9aa4b2";
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function drawAxes(ctx, w, h, p) {
  ctx.strokeStyle = "#445066";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(p, p);
  ctx.lineTo(p, h - p);
  ctx.lineTo(w - p, h - p);
  ctx.stroke();
}

/* =========================
   CHARTS
========================= */
function drawStrengthChart(workouts) {
  if (!workouts.length) return drawEmptyChart(strengthChart, "No workout data.");

  const ctx = strengthChart.getContext("2d");
  resizeCanvas(strengthChart);

  const w = strengthChart.width;
  const h = strengthChart.height;
  const p = 50;

  ctx.clearRect(0, 0, w, h);
  drawAxes(ctx, w, h, p);

  const points = workouts.map(w =>
    Math.max(...w.exercises.map(e => Number(e.weight || 0)), 0)
  );

  const max = Math.max(...points, 1);

  ctx.strokeStyle = "#b7ff3c";
  ctx.lineWidth = 3;
  ctx.beginPath();

  points.forEach((val, i) => {
    const x = p + ((w - p * 2) / Math.max(points.length - 1, 1)) * i;
    const y = h - p - (val / max) * (h - p * 2);

    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function drawBodyweightChart(profile) {
  const current = Number(profile.currentWeight || 0);
  const goal = Number(profile.goalWeight || 0);

  if (!current && !goal)
    return drawEmptyChart(bodyweightChart, "No bodyweight data.");

  const ctx = bodyweightChart.getContext("2d");
  resizeCanvas(bodyweightChart);

  const w = bodyweightChart.width;
  const h = bodyweightChart.height;
  const p = 50;

  ctx.clearRect(0, 0, w, h);
  drawAxes(ctx, w, h, p);

  const values = [current, current, goal];
  const max = Math.max(...values, 1);

  ctx.strokeStyle = "#6fd3ff";
  ctx.beginPath();

  values.forEach((v, i) => {
    const x = p + ((w - p * 2) / (values.length - 1)) * i;
    const y = h - p - (v / max) * (h - p * 2);

    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function drawMacroChart(entries) {
  if (!entries.length)
    return drawEmptyChart(macroChart, "No nutrition data.");

  const daily = {};

  entries.forEach(e => {
    if (!daily[e.date]) daily[e.date] = { protein: 0, carbs: 0, fat: 0 };
    daily[e.date].protein += e.protein_g || 0;
    daily[e.date].carbs += e.carbs_g || 0;
    daily[e.date].fat += e.fat_g || 0;
  });

  const days = Object.keys(daily).length || 1;

  const avg = {
    protein: Object.values(daily).reduce((s, d) => s + d.protein, 0) / days,
    carbs: Object.values(daily).reduce((s, d) => s + d.carbs, 0) / days,
    fat: Object.values(daily).reduce((s, d) => s + d.fat, 0) / days
  };

  const ctx = macroChart.getContext("2d");
  resizeCanvas(macroChart);

  const w = macroChart.width;
  const h = macroChart.height;
  const p = 50;

  ctx.clearRect(0, 0, w, h);
  drawAxes(ctx, w, h, p);

  const values = [
    { label: "Protein", value: avg.protein },
    { label: "Carbs", value: avg.carbs },
    { label: "Fat", value: avg.fat }
  ];

  const max = Math.max(...values.map(v => v.value), 1);
  const barW = 80;
  const gap = 50;

  const startX = (w - (values.length * barW + (values.length - 1) * gap)) / 2;

  values.forEach((v, i) => {
    const x = startX + i * (barW + gap);
    const barH = (v.value / max) * (h - p * 2);
    const y = h - p - barH;

    ctx.fillStyle = "#b7ff3c";
    ctx.fillRect(x, y, barW, barH);
  });
}

/* =========================
   STATS
========================= */
function calculateStreak(workouts) {
  const days = [...new Set(workouts.map(w => new Date(w.date).toDateString()))];

  let streak = 0;
  const d = new Date();

  for (let i = 0; i < 365; i++) {
    if (days.includes(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (streak > 0) break;
    else d.setDate(d.getDate() - 1);
  }

  return streak;
}

function calculateAvgCalories(entries) {
  const map = {};

  entries.forEach(e => {
    map[e.date] = (map[e.date] || 0) + (e.calories || 0);
  });

  const days = Object.keys(map).length || 1;
  return Math.round(Object.values(map).reduce((s, v) => s + v, 0) / days);
}

function calculateGoals(profile) {
  const w = Number(profile.currentWeight || 0);

  if (!w) return { calories: 2200, protein: 140, carbs: 220, fat: 70 };

  return {
    calories: Math.round(w * 15),
    protein: Math.round(w * 0.8),
    carbs: Math.round(w * 1.1),
    fat: Math.round(w * 0.3)
  };
}

/* =========================
   RENDER
========================= */
function render() {
  const workouts = filterByRange(getSavedWorkouts(), selectedRangeDays);
  const nutrition = filterByRange(getNutritionLog(), selectedRangeDays);
  const profile = getProfile();

  drawStrengthChart(workouts);
  drawBodyweightChart(profile);
  drawMacroChart(nutrition);

  totalWorkoutsStat.textContent = workouts.length;
  avgCaloriesStat.textContent = calculateAvgCalories(nutrition);
  currentStreakStat.textContent = calculateStreak(workouts);

  const goals = calculateGoals(profile);

  targetCaloriesStat.textContent = goals.calories;
  targetProteinStat.textContent = `${goals.protein} g`;
  targetCarbsStat.textContent = `${goals.carbs} g`;
  targetFatStat.textContent = `${goals.fat} g`;
}

/* =========================
   EVENTS
========================= */
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active-filter"));
    btn.classList.add("active-filter");

    selectedRangeDays = Number(btn.dataset.range);
    render();
  });
});

logoutBtn?.addEventListener("click", logoutUser);
window.addEventListener("resize", render);

/* =========================
   INIT
========================= */
protectPage();
updateUserStatus();
render();