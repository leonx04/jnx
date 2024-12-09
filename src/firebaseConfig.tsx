import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAC9B0uaUUzRikg2uQEt98LjHvMTG2VFSY",
  authDomain: "jnx-store.firebaseapp.com",
  projectId: "jnx-store",
  storageBucket: "jnx-store.firebasestorage.app",
  messagingSenderId: "908066479930",
  appId: "1:908066479930:web:f68afe79b617ae370fba03",
  measurementId: "G-D7N0HG7J3S",
  databaseURL: "https://jnx-store-default-rtdb.firebaseio.com" // Thêm dòng này
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
