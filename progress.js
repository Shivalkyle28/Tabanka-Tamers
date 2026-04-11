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

  if (currentUser) {
    userStatus.textContent = currentUser.username;
    userStatus.classList.add("clickable-user");
    userStatus.onclick = function () {
      window.location.href = "profile.html";
    };
  } else {
    userStatus.textContent = "Guest";
    userStatus.classList.remove("clickable-user");
    userStatus.onclick = null;
  }
}

function getSavedWorkouts() {
  const key = getUserStorageKey("savedWorkouts");
  return JSON.parse(localStorage.getItem(key)) || [];
}

function getDailyNutritionLog() {
  const key = getUserStorageKey("dailyNutritionLog");
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

function filterNutritionByRange(entries, days) {
  const now = new Date();

  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const diffMs = now - entryDate;
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

    return { value: maxWeight };
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
    { value: current || goal || 0 },
    { value: current || goal || 0 },
    { value: goal || current || 0 }
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

function calculateMacroAverages(entries) {
  if (!entries.length) {
    return {
      protein: 0,
      carbs: 0,
      fat: 0,
      daysLogged: 0
    };
  }

  const dailyMap = {};

  entries.forEach(entry => {
    if (!dailyMap[entry.date]) {
      dailyMap[entry.date] = {
        protein: 0,
        carbs: 0,
        fat: 0,
        calories: 0
      };
    }

    dailyMap[entry.date].protein += Number(entry.protein_g || 0);
    dailyMap[entry.date].carbs += Number(entry.carbs_g || 0);
    dailyMap[entry.date].fat += Number(entry.fat_g || 0);
    dailyMap[entry.date].calories += Number(entry.calories || 0);
  });

  const daysLogged = Object.keys(dailyMap).length || 1;

  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  Object.values(dailyMap).forEach(day => {
    totalProtein += day.protein;
    totalCarbs += day.carbs;
    totalFat += day.fat;
  });

  return {
    protein: Math.round(totalProtein / daysLogged),
    carbs: Math.round(totalCarbs / daysLogged),
    fat: Math.round(totalFat / daysLogged),
    daysLogged
  };
}

function drawMacroChart(entries) {
  if (!entries.length) {
    drawEmptyChart(macroChart, "No nutrition log data available.");
    return;
  }

  const averages = calculateMacroAverages(entries);

  const ctx = macroChart.getContext("2d");
  resizeCanvas(macroChart);

  const width = macroChart.width;
  const height = macroChart.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);
  drawAxes(ctx, width, height, padding);

  const values = [
    { label: "Protein", value: averages.protein, color: "#7b7f87" },
    { label: "Carbs", value: averages.carbs, color: "#a8adb8" },
    { label: "Fat", value: averages.fat, color: "#d8dbe2" }
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

  const workoutDays = [...new Set(
    workouts.map(workout => new Date(workout.date).toDateString())
  )];

  let streak = 0;
  const currentDate = new Date();

  for (let i = 0; i < 365; i++) {
    const dateString = currentDate.toDateString();

    if (workoutDays.includes(dateString)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (streak > 0) {
      break;
    } else {
      currentDate.setDate(currentDate.getDate() - 1);
    }
  }

  return streak;
}

function calculateAvgCalories(entries) {
  if (!entries.length) return 0;

  const dailyMap = {};

  entries.forEach(entry => {
    if (!dailyMap[entry.date]) {
      dailyMap[entry.date] = 0;
    }

    dailyMap[entry.date] += Number(entry.calories || 0);
  });

  const daysLogged = Object.keys(dailyMap).length || 1;
  const totalCalories = Object.values(dailyMap).reduce((sum, value) => sum + value, 0);

  return Math.round(totalCalories / daysLogged);
}

function calculateAdaptiveGoals(profile) {
  const currentWeight = Number(profile.currentWeight || 0);
  const goalWeight = Number(profile.goalWeight || 0);
  const fitnessGoal = String(profile.fitnessGoal || "").toLowerCase();

  const fallbackCalories = 2200;
  const fallbackProtein = 140;
  const fallbackCarbs = 220;
  const fallbackFat = 70;

  if (!currentWeight) {
    return {
      calories: fallbackCalories,
      protein: fallbackProtein,
      carbs: fallbackCarbs,
      fat: fallbackFat
    };
  }

  let caloriesTarget = currentWeight * 15;
  let proteinTarget = currentWeight * 0.8;
  let carbsTarget = currentWeight * 1.0;
  let fatTarget = currentWeight * 0.3;

  if (fitnessGoal === "lose weight") {
    caloriesTarget = currentWeight * 12;
    proteinTarget = currentWeight * 0.9;
    carbsTarget = currentWeight * 0.7;
    fatTarget = currentWeight * 0.3;
  } else if (fitnessGoal === "gain muscle") {
    caloriesTarget = currentWeight * 17;
    proteinTarget = currentWeight * 1.0;
    carbsTarget = currentWeight * 1.5;
    fatTarget = currentWeight * 0.35;
  } else if (fitnessGoal === "improve endurance") {
    caloriesTarget = currentWeight * 16;
    proteinTarget = currentWeight * 0.8;
    carbsTarget = currentWeight * 1.6;
    fatTarget = currentWeight * 0.3;
  } else if (fitnessGoal === "maintain" || fitnessGoal === "general fitness") {
    caloriesTarget = currentWeight * 15;
    proteinTarget = currentWeight * 0.85;
    carbsTarget = currentWeight * 1.1;
    fatTarget = currentWeight * 0.32;
  }

  if (goalWeight && fitnessGoal === "lose weight" && goalWeight < currentWeight) {
    caloriesTarget -= 100;
  }

  if (goalWeight && fitnessGoal === "gain muscle" && goalWeight > currentWeight) {
    caloriesTarget += 100;
  }

  return {
    calories: Math.round(caloriesTarget),
    protein: Math.round(proteinTarget),
    carbs: Math.round(carbsTarget),
    fat: Math.round(fatTarget)
  };
}

function updateSummaryStats(workouts, nutritionEntries, profile) {
  totalWorkoutsStat.textContent = workouts.length;
  avgCaloriesStat.textContent = calculateAvgCalories(nutritionEntries);
  currentStreakStat.textContent = calculateCurrentStreak(workouts);

  const goals = calculateAdaptiveGoals(profile);

  totalWorkoutsStat.title = `Adaptive daily targets: ${goals.calories} kcal, ${goals.protein}g protein, ${goals.carbs}g carbs, ${goals.fat}g fat`;
  avgCaloriesStat.title = `Adaptive calorie goal: ${goals.calories} kcal/day`;
  currentStreakStat.title = `Adaptive protein goal: ${goals.protein} g/day`;
}

function renderProgressPage() {
  const workouts = filterWorkoutsByRange(getSavedWorkouts(), selectedRangeDays);
  const nutritionEntries = filterNutritionByRange(getDailyNutritionLog(), selectedRangeDays);
  const profile = getProfile();

  drawStrengthChart(workouts);
  drawBodyweightChart(profile);
  drawMacroChart(nutritionEntries);
  updateSummaryStats(workouts, nutritionEntries, profile);
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