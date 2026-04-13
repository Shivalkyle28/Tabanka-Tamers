/* =========================
   STORAGE HELPERS
========================= */
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("currentUser");
}

/* =========================
   AUTH LOGIC
========================= */
function loginUser(identifier, password) {
  const users = getUsers();

  const matchedUser = users.find(user => {
    return (
      (user.username === identifier || user.email === identifier) &&
      user.password === password
    );
  });

  if (!matchedUser) {
    return {
      success: false,
      message: "Invalid username/email or password."
    };
  }

  setCurrentUser({
    username: matchedUser.username,
    email: matchedUser.email
  });

  return {
    success: true,
    message: "Login successful."
  };
}

function signupUser(username, email, password) {
  const users = getUsers();

  const usernameExists = users.some(
    user => user.username.toLowerCase() === username.toLowerCase()
  );

  const emailExists = users.some(
    user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (usernameExists) {
    return {
      success: false,
      message: "Username already exists."
    };
  }

  if (emailExists) {
    return {
      success: false,
      message: "Email already exists."
    };
  }

  const newUser = { username, email, password };
  users.push(newUser);
  saveUsers(users);

  setCurrentUser({
    username: newUser.username,
    email: newUser.email
  });

  return {
    success: true,
    message: "Account created successfully."
  };
}

function logoutUser() {
  clearCurrentUser();
  window.location.href = "../index.html";
}

function protectPage() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("You must be logged in to view this page.");
    window.location.href = "../pages/auth.html";
  }
}

/* =========================
   THEME
========================= */
function applySavedTheme() {
  const user = getCurrentUser();

  document.body.classList.remove("light-mode");

  if (!user) return;

  const preferencesKey = `preferences_${user.username}`;
  const preferences = JSON.parse(localStorage.getItem(preferencesKey)) || {};

  if (preferences.theme === "light") {
    document.body.classList.add("light-mode");
  }
}

/* =========================
   NAVBAR HELPERS
========================= */
function updateAuthButton() {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  const currentUser = getCurrentUser();

  if (currentUser) {
    loginBtn.textContent = currentUser.username;
    loginBtn.classList.add("clickable-user");
    loginBtn.onclick = function () {
      window.location.href = "pages/profile.html";
    };
  } else {
    loginBtn.textContent = "Login";
    loginBtn.classList.remove("clickable-user");
    loginBtn.onclick = function () {
      window.location.href = "pages/auth.html";
    };
  }
}

function updateNavbarForPages() {
  const currentUser = getCurrentUser();
  const userStatus = document.getElementById("userStatus");
  const logoutBtn = document.getElementById("logoutBtn");

  if (userStatus) {
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

  if (logoutBtn) {
    logoutBtn.onclick = logoutUser;
  }
}

/* =========================
   AUTH PAGE SETUP
========================= */
function setupAuthPage() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const showLoginBtn = document.getElementById("showLoginBtn");
  const showSignupBtn = document.getElementById("showSignupBtn");
  const loginMessage = document.getElementById("loginMessage");
  const signupMessage = document.getElementById("signupMessage");

  if (!loginForm || !signupForm || !showLoginBtn || !showSignupBtn) {
    return;
  }

  showLoginBtn.addEventListener("click", function () {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    showLoginBtn.classList.add("active-tab");
    showSignupBtn.classList.remove("active-tab");
    loginMessage.textContent = "";
    signupMessage.textContent = "";
  });

  showSignupBtn.addEventListener("click", function () {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    showSignupBtn.classList.add("active-tab");
    showLoginBtn.classList.remove("active-tab");
    loginMessage.textContent = "";
    signupMessage.textContent = "";
  });

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    const result = loginUser(identifier, password);
    loginMessage.textContent = result.message;

    if (result.success) {
      window.location.href = "dashboard.html";
    }
  });

  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    if (username.length < 3) {
      signupMessage.textContent = "Username must be at least 3 characters.";
      return;
    }

    if (password.length < 4) {
      signupMessage.textContent = "Password must be at least 4 characters.";
      return;
    }

    const result = signupUser(username, email, password);
    signupMessage.textContent = result.message;

    if (result.success) {
      window.location.href = "dashboard.html";
    }
  });
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", function () {
  applySavedTheme();
  updateAuthButton();
  updateNavbarForPages();
  setupAuthPage();
});