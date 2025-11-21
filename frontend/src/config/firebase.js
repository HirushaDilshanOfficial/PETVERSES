// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Configuration for your Firebase project: test12345-85823
const firebaseConfig = {
  apiKey: "AIzaSyCO_Ah0KcHnBIGnkbfL217loyP-LAV1NzQ",
  authDomain: "test12345-85823.firebaseapp.com",
  projectId: "test12345-85823",
  storageBucket: "test12345-85823.firebasestorage.app",
  messagingSenderId: "730571592007",
  appId: "1:730571592007:web:ef3ee6e446f0f96219bc62",
  databaseURL: "https://test12345-85823-default-rtdb.firebaseio.com/",
  measurementId: "G-K54CLL0ZFK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
