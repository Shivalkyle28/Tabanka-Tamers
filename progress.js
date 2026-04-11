const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

const strengthChart = document.getElementById("strengthChart");
const bodyweightChart = document.getElementById("bodyweightChart");
const macroChart = document.getElementById("macroChart");

const totalWorkoutsStat = document.getElementById("totalWorkoutsStat");
const avgCaloriesStat = document.getElementById("avgCaloriesStat");
const currentStreakStat = document.getElementById("currentStreakStat");

const filterButtons = document.querySelectorAll(".progress-filter-btn");

let selectedRangeDays = 7;

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getUserStorageKey(baseKey) {
  const currentUser = getCurrentUser();
  return currentUser ? `${baseKey}_${currentUser.username}` : null;
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

function getSavedWorkouts() {
  const key = getUserStorageKey("savedWorkouts");
  return JSON.parse(localStorage.getItem(key)) || [];
}

function getFavoriteFoods() {
  const key = getUserStorageKey("favoriteFoods");
  return JSON.parse(localStorage.getItem(key)) || [];
}

function getProfile() {
  const key = getUserStorageKey("profile");
  return JSON.parse(localStorage.getItem(key)) || {};
}

function logoutPageUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
}

function filterWorkoutsByRange(workouts, days) {
  const now = new Date();

  return workouts.filter(workout => {
    const workoutDate = new Date(workout.date);
    const diffMs = now - workoutDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  });
}

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
  ctx.font = "16px Inter";
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function drawAxes(ctx, width, height, padding) {
  ctx.strokeStyle = "#445066";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
}

function drawStrengthChart(workouts) {
  if (!workouts.length) {
    drawEmptyChart(strengthChart, "No workout data available.");
    return;
  }

  const ctx = strengthChart.getContext("2d");
  resizeCanvas(strengthChart);

  const width = strengthChart.width;
  const height = strengthChart.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);
  drawAxes(ctx, width, height, padding);

  const strengthPoints = workouts.map(workout => {
    const maxWeight = Math.max(
      ...workout.exercises.map(exercise => Number(exercise.weight || 0)),
      0
    );

    return {
      date: new Date(workout.date),
      value: maxWeight
    };
  });

  const maxValue = Math.max(...strengthPoints.map(point => point.value), 1);

  ctx.strokeStyle = "#b7ff3c";
  ctx.fillStyle = "#b7ff3c";
  ctx.lineWidth = 3;

  ctx.beginPath();

  strengthPoints.forEach((point, index) => {
    const x = padding + ((width - padding * 2) / Math.max(strengthPoints.length - 1, 1)) * index;
    const y = height - padding - (point.value / maxValue) * (height - padding * 2);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  strengthPoints.forEach((point, index) => {
    const x = padding + ((width - padding * 2) / Math.max(strengthPoints.length - 1, 1)) * index;
    const y = height - padding - (point.value / maxValue) * (height - padding * 2);

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBodyweightChart(profile) {
  const current = Number(profile.currentWeight || 0);
  const goal = Number(profile.goalWeight || 0);

  if (!current && !goal) {
    drawEmptyChart(bodyweightChart, "No bodyweight data available.");
    return;
  }

  const ctx = bodyweightChart.getContext("2d");
  resizeCanvas(bodyweightChart);

  const width = bodyweightChart.width;
  const height = bodyweightChart.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);
  drawAxes(ctx, width, height, padding);

  const points = [
    { label: "Start", value: current || goal || 0 },
    { label: "Now", value: current || goal || 0 },
    { label: "Goal", value: goal || current || 0 }
  ];

  const maxValue = Math.max(...points.map(point => point.value), 1);

  ctx.strokeStyle = "#6fd3ff";
  ctx.fillStyle = "#6fd3ff";
  ctx.lineWidth = 3;

  ctx.beginPath();

  points.forEach((point, index) => {
    const x = padding + ((width - padding * 2) / (points.length - 1)) * index;
    const y = height - padding - (point.value / maxValue) * (height - padding * 2);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

function drawMacroChart(foods) {
  if (!foods.length) {
    drawEmptyChart(macroChart, "No nutrition data available.");
    return;
  }

  const ctx = macroChart.getContext("2d");
  resizeCanvas(macroChart);

  const width = macroChart.width;
  const height = macroChart.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);
  drawAxes(ctx, width, height, padding);

  const protein = foods.reduce((sum, food) => sum + Number(food.protein || 0), 0) / foods.length;
  const carbs = foods.reduce((sum, food) => sum + Number(food.carbs || 0), 0) / foods.length;
  const fat = foods.reduce((sum, food) => sum + Number(food.fat || 0), 0) / foods.length;

  const values = [
    { label: "Protein", value: protein, color: "#7b7f87" },
    { label: "Carbs", value: carbs, color: "#a8adb8" },
    { label: "Fat", value: fat, color: "#d8dbe2" }
  ];

  const maxValue = Math.max(...values.map(item => item.value), 1);
  const barWidth = 80;
  const gap = 50;
  const startX = (width - (values.length * barWidth + (values.length - 1) * gap)) / 2;

  values.forEach((item, index) => {
    const x = startX + index * (barWidth + gap);
    const barHeight = (item.value / maxValue) * (height - padding * 2);
    const y = height - padding - barHeight;

    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#dbe2ea";
    ctx.font = "14px Inter";
    ctx.textAlign = "center";
    ctx.fillText(item.label, x + barWidth / 2, height - 20);
  });
}

function calculateCurrentStreak(workouts) {
  if (!workouts.length) return 0;

  const uniqueDays = [...new Set(
    workouts.map(workout => new Date(workout.date).toDateString())
  )];

  uniqueDays.sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let currentDate = new Date();

  for (const day of uniqueDays) {
    const dateString = currentDate.toDateString();

    if (day === dateString) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function updateSummaryStats(workouts, foods) {
  totalWorkoutsStat.textContent = workouts.length;

  const totalCalories = foods.reduce((sum, food) => sum + Number(food.calories || 0), 0);
  const avgCalories = foods.length ? Math.round(totalCalories / foods.length) : 0;
  avgCaloriesStat.textContent = avgCalories;

  currentStreakStat.textContent = calculateCurrentStreak(workouts);
}

function renderProgressPage() {
  const workouts = filterWorkoutsByRange(getSavedWorkouts(), selectedRangeDays);
  const foods = getFavoriteFoods();
  const profile = getProfile();

  drawStrengthChart(workouts);
  drawBodyweightChart(profile);
  drawMacroChart(foods);
  updateSummaryStats(workouts, foods);
}

filterButtons.forEach(button => {
  button.addEventListener("click", function () {
    filterButtons.forEach(btn => btn.classList.remove("active-filter"));
    this.classList.add("active-filter");

    selectedRangeDays = Number(this.dataset.range);
    renderProgressPage();
  });
});

logoutBtn.addEventListener("click", logoutPageUser);

window.addEventListener("resize", renderProgressPage);

protectPage();
updateUserStatus();
renderProgressPage();