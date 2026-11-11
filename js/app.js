// =========================
// IMPORTS
// =========================

import { onAuthStateChanged, updateProfile, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// =========================
// ELEMENTS
// =========================

const loadingScreen = document.getElementById("loading-screen");

const settingsButton = document.getElementById("settings-button");
const settingsOverlay = document.getElementById("settings-overlay");
const closeSettings = document.getElementById("close-settings");

const editProfileButton = document.getElementById("edit-profile");
const editProfileOverlay = document.getElementById("edit-profile-overlay");
const closeEditProfile = document.getElementById("close-edit-profile");
const editProfileForm = document.getElementById("edit-profile-form");

const editDisplayName = document.getElementById("edit-displayname");
const editUsername = document.getElementById("edit-username");
const profileMessage = document.getElementById("profile-message");

const changePasswordButton = document.getElementById("change-password");
const changePasswordOverlay = document.getElementById("change-password-overlay");
const closeChangePassword = document.getElementById("close-change-password");
const changePasswordForm = document.getElementById("change-password-form");

const currentPassword = document.getElementById("current-password");
const newPassword = document.getElementById("new-password");
const confirmNewPassword = document.getElementById("confirm-new-password");
const passwordMessage = document.getElementById("password-message");

const appearanceButton = document.getElementById("appearance-settings");
const appearanceOverlay = document.getElementById("appearance-overlay");
const closeAppearance = document.getElementById("close-appearance");
const themeSelect = document.getElementById("theme-select");
const accentSelect = document.getElementById("accent-select");

const messagesNav = document.getElementById("messages-nav");
const friendsNav = document.getElementById("friends-nav");
const requestsNav = document.getElementById("requests-nav");

const messagesView = document.getElementById("messages-view");
const friendsView = document.getElementById("friends-view");
const requestsView = document.getElementById("requests-view");

const contentTitle = document.getElementById("content-title");

// =========================
// WINDOW CONTROLS
// =========================

function showView(view) {
  messagesView.hidden = view !== "messages";
  friendsView.hidden = view !== "friends";
  requestsView.hidden = view !== "requests";

  messagesNav.classList.toggle("active", view === "messages");
  friendsNav.classList.toggle("active", view === "friends");
  requestsNav.classList.toggle("active", view === "requests");

  const titles = {
    messages: "Messages",
    friends: "Friends",
    requests: "Requests"
  };

  contentTitle.textContent = titles[view];
}

messagesNav.addEventListener("click", () => {
  showView("messages");
});

friendsNav.addEventListener("click", () => {
  showView("friends");
});

requestsNav.addEventListener("click", () => {
  showView("requests");
});

settingsButton.addEventListener("click", () => {
  settingsOverlay.hidden = false;
});

closeSettings.addEventListener("click", () => {
  settingsOverlay.hidden = true;
});

settingsOverlay.addEventListener("click", (event) => {
  if (event.target === settingsOverlay) {
    settingsOverlay.hidden = true;
  }
});

editProfileButton.addEventListener("click", () => {
  editDisplayName.value = document.querySelector(".profile-name").textContent;
  editUsername.value = document.querySelector(".profile-username").textContent;
  
  profileMessage.textContent = "";
  editProfileOverlay.hidden = false;
});

closeEditProfile.addEventListener("click", () => {
  editProfileOverlay.hidden = true;
});

editProfileOverlay.addEventListener("click", (event) => {
  if (event.target === editProfileOverlay) {
    editProfileOverlay.hidden = true;
  }
});

changePasswordButton.addEventListener("click", () => {
  passwordMessage.textContent = ""
  changePasswordForm.reset();
  changePasswordOverlay.hidden = false;
});

closeChangePassword.addEventListener("click", () => {
  changePasswordOverlay.hidden = true;
});

changePasswordOverlay.addEventListener("click", (event) => {
  if (event.target === changePasswordOverlay) {
    changePasswordOverlay.hidden = true;
  }
});

appearanceButton.addEventListener("click", () => {
  appearanceOverlay.hidden = false;
});

closeAppearance.addEventListener("click", () => {
  appearanceOverlay.hidden = true;
});

appearanceOverlay.addEventListener("click", () => {
  if (event.target === appearanceOverlay) {
    appearanceOverlay.hidden = true;
  }
});

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
// CHECK IF SIGNED-IN, AND LOAD USER DATA
// =========================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    const userData = userSnapshot.data();

    document.querySelector(".profile-name").textContent = userData.displayName;
    document.querySelector(".profile-username").textContent = "@" + userData.username;

    const avatar = document.getElementById("profile-avatar");
    avatar.textContent = userData.displayName.charAt(0).toUpperCase();

    document.getElementById("settings-avatar").textContent = userData.displayName.charAt(0).toUpperCase();
    document.getElementById("settings-displayname").textContent = userData.displayName;
    document.getElementById("settings-username").textContent = "@" + userData.username;
  }

  console.log("Authenticated as:", user.uid);

  hideLoading();
});

// =========================
// EDIT PROFILE FORM SUBMISSION
// =========================

editProfileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newDisplayName = editDisplayName.value.trim();

  if (newDisplayName.length < 1 || newDisplayName.length > 32) {
    profileMessage.textContent = "Display name must be between 1 and 32 characters.";
    return;
  }

  try {
    profileMessage.textContent = "Saving changes...";

    const user = auth.currentUser;

    await updateProfile(user, {
      displayName: newDisplayName
    });

    await updateDoc(doc(db, "users", user.uid), {
      displayName: newDisplayName
    });

    document.querySelector(".profile-name").textContent = newDisplayName;
    document.querySelector("#settings-displayname").textContent = newDisplayName;
    document.querySelector("#profile-avatar").textContent = newDisplayName.charAt(0).toUpperCase();
    document.querySelector("#settings-avatar").textContent = newDisplayName.charAt(0).toUpperCase();

    profileMessage.textContent = "Profile updated successfully!";
  } catch (error) {
    console.error(error);
    profileMessage.textContent = "Unable to update your profile. Please try again.";
  }
});

// =========================
// CHANGE PASSWORD FORM SUBMISSION
// =========================

changePasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const current = currentPassword.value;
  const newPass = newPassword.value;
  const confirmPass = confirmNewPassword.value;

  if (newPass.length < 8) {
    passwordMessage.textContent = "Your new password must be at least 8 characters long.";
    return;
  }

  if (newPass !== confirmPass) {
    passwordMessage.textContent = "Your new passwords do not match.";
    return;
  }

  if (current === newPass) {
    passwordMessage.textContent = "Your new password must be different from your current password.";
    return;
  }

  try {
    passwordMessage.textContent = "Updating password...";

    const user = auth.currentUser;

    const credential = EmailAuthProvider.credential(user.email, current);

    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);

    passwordMessage.textContent = "Password updated successfully!";

    changePasswordForm.reset();
  } catch (error) {
    console.error(error);

    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      passwordMessage.textContent = "Your current password is incorrect.";
    } else if (error.code === "auth/weak-password") {
      passwordMessage.textContent = "Your new password is too weak.";
    } else if (error.code === "auth/requires-recent-login") {
      passwordMessage.textContent = "Please sign out and sign back in before changing your password.";
    } else {
      passwordMessage.textContent = "Unable to update your password. Please try again.";
    }
  }
});

// =========================
// CHANGE AND SAVE THEME
// =========================

const savedTheme = localStorage.getItem("saje-theme") || "dark";

document.documentElement.dataset.theme = savedTheme;
themeSelect.value = savedTheme;

themeSelect.addEventListener("change", () => {
  const selectedTheme = themeSelect.value;
  
  document.documentElement.dataset.theme = selectedTheme;
  localStorage.setItem("saje-theme", selectedTheme);
});

// =========================
// CHANGE AND SAVE ACCENT COLOR
// =========================

const savedAccent = localStorage.getItem("saje-accent") || "#8b5cf6";

document.documentElement.style.setProperty("--accent", savedAccent);
accentSelect.value = savedAccent;

accentSelect.addEventListener("change", () => {
  const selectedAccent = accentSelect.value;

  document.documentElement.style.setProperty("--acent", selectedAccent);
  localStorage.setItem("saje-accent", selectedAccent);
});
