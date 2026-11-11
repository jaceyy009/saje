import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBuWME6TCF9bSHBToagmyk-xTj-LtQ8fjU",
  authDomain: "saje-7c6e9.firebaseapp.com",
  projectId: "saje-7c6e9",
  storageBucket: "saje-7c6e9.firebasestorage.app",
  messagingSenderId: "1016327238549",
  appId: "1:1016327238549:web:da1bb4e64423549dd53c9c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
