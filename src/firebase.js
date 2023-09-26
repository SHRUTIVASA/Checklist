import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth } from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCHSouusB1g-znIrFzM__DtEUy9YkXwSKY",
  authDomain: "checklist-app-c15bb.firebaseapp.com",
  projectId: "checklist-app-c15bb",
  storageBucket: "checklist-app-c15bb.appspot.com",
  messagingSenderId: "24004038101",
  appId: "1:24004038101:web:b7c7b7ed201956b984415c",
  measurementId: "G-4M7SMKQMR1"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
export const db = getFirestore(app);
const firestore = getFirestore(app);

export { auth };
export { firestore };
