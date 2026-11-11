import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { doc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// =========================
// ELEMENTS
// =========================

const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const authMessage = document.getElementById("auth-message");

const loadingScreen = document.getElementById("loading-screen");
const loadingTitle = document.getElementById("loading-title");
const loadingDescription = document.getElementById("loading-description");

// =========================
// HIDE LOADING
// =========================

function hideLoading() {
  loadingScreen.classList.add("fade-out");

  setTimeout(() => {
    loadingScreen.hidden = true;
    loadingScreen.classList.remove("fade-out");
  }, 400);
}

// =========================
// TAB SWITCHING
// =========================

function showLogin() {
  loginForm.hidden = false;
  signupForm.hidden = true;

  loginTab.classList.add("active");
  signupTab.classList.remove("active");

  clearMessage();
}

function showSignup() {
  loginForm.hidden = true;
  signupForm.hidden = false;

  loginTab.classList.remove("active");
  signupTab.classList.add("active");

  clearMessage();
}

loginTab.addEventListener("click", showLogin);
signupTab.addEventListener("click", showSignup);

// =========================
// MESSAGES
// =========================

function showMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle("error", isError);
}

function clearMessage() {
  authMessage.textContent = "";
  authMessage.classList.remove("error");
}

// =========================
// USERNAME VALIDATION
// =========================

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// =========================
// LOGIN
// =========================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const emailOrUsername = document.getElementById("login-email").value.trim();

  const password = document.getElementById("login-password").value;

  if (!emailOrUsername.includes("@")) {
    showMessage(
      "Username login is coming soon. Please use your email for now.",
      true
    );
    return;
  }

  try {
    showMessage("Signing in...");

    await signInWithEmailAndPassword(
      auth,
      emailOrUsername,
      password
    );

    showMessage("Successfully signed in!");

    // need to add the chat page redirect
  } catch (error) {
    console.error(error);

    let message = "Unable to sign in. Please try again.";

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      message = "Incorrect email or password.";
    }

    if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Please try again later.";
    }

    showMessage(message, true);
  }
});

// =========================
// SIGN UP
// =========================

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const username = document.getElementById("signup-username").value.trim().toLowerCase();
  const usernameLower = username.toLowerCase();
  const displayName = document.getElementById("signup-displayname").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm-password").value;

  // Validate username

  if (!validateUsername(username)) {
    showMessage(
      "Username must be 3-20 characters and contain only letters, numbers, and underscores.",
      true
    );
    return;
  }

  // Validate display name

  if (displayName.length < 1 || displayName.length > 32) {
    showMessage(
      "Display name must be between 1 and 32 characters.",
      true
    );
    return;
  }

  // Validate password

  if (password.length < 8) {
    showMessage(
      "Your password must contain at least 8 characters.",
      true
    );
    return;
  }

  // Confirm password

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", true);
    return;
  }

  let user = null;

  try {
    showMessage("Creating your account...");

    // Create Firebase Authentication account

    const credential = await createUserWithEmailAndPassword(auth, email, password);

    user = credential.user;

    // Set Firebase display name

    await updateProfile(user, {
      displayName: displayName
    });

    // Atomically reserve username and create profile

    await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, "usernames", usernameLower);

      const userRef = doc(db, "users", user.uid);

      const usernameSnapshot = await transaction.get(usernameRef);

      if (usernameSnapshot.exists()) {
        throw new Error("USERNAME_TAKEN");
      }

      transaction.set(usernameRef, {
        uid: user.uid,
        createdAt: serverTimestamp()
      });

      transaction.set(userRef, {
        username: username,
        usernameLower: usernameLower,
        displayName: displayName,
        createdAt: serverTimestamp()
      });
    });

    showMessage("Your Saje account has been created!");

    signupForm.reset();

    // the chat page redirect will be added here
  } catch (error) {
    console.error(error);

    // Remove the newly created Auth account if profile
    // creation failed, preventing an orphaned account

    if (user) {
      try {
        await deleteUser(user);
      } catch (rollbackError) {
        console.error(
          "Account cleanup failed:",
          rollbackError
        );
      }
    }

    let message = "Unable to create your account.";

    if (error.message === "USERNAME_TAKEN") {
      message = "That username is already taken.";
    } else if (error.code === "auth/email-already-in-use") {
      message = "An account already exists with this email.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (error.code === "auth/weak-password") {
      message = "Your password is too weak.";
    } else if (error.code === "permission-denied" ||
               error.code === "firestore/permission-denied") {
      message = "Database permissions prevented account creation. Please check the Firestore rules.";
    }

    showMessage(message, true);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("index.html");
  } else {
    hideLoading();
  }
});
