/* Get all users from localStorage */
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

/* Save all users to localStorage */
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

/* Get current logged-in user */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

/* Save current logged-in user */
function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

/* Clear current logged-in user */
function clearCurrentUser() {
  localStorage.removeItem("currentUser");
}

/* Login existing user */
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

/* Sign up new user */
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

/* Logout user */
function logoutUser() {
  clearCurrentUser();
  window.location.href = "../index.html";
}

/* Protect logged-in pages */
function protectPage() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("You must be logged in to view this page.");
    window.location.href = "../pages/auth.html";
  }
}

/* Update homepage login button */
function updateAuthButton() {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  const currentUser = getCurrentUser();

  if (currentUser) {
    loginBtn.textContent = currentUser.username;
    loginBtn.onclick = function () {
      window.location.href = "pages/dashboard.html";
    };
  } else {
    loginBtn.textContent = "Login";
    loginBtn.onclick = function () {
      window.location.href = "pages/auth.html";
    };
  }
}

/* Wire up login/signup page */
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

document.addEventListener("DOMContentLoaded", function () {
  updateAuthButton();
  setupAuthPage();
});