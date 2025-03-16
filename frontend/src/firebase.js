import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBOVENQfGB99wQ3Aer8_ppjd2VK6UMd2zA",
    authDomain: "test-project-torque.firebaseapp.com",
    projectId: "test-project-torque",
    storageBucket: "test-project-torque.firebasestorage.app",
    messagingSenderId: "600233539261",
    appId: "1:600233539261:web:9efd0f4d564154321aa9d4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };