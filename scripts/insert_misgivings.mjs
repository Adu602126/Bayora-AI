import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBQlqXYOu7mrxy1IJmuRLxZ111Oyp9j1DA",
  authDomain: "safepath-87f4d.firebaseapp.com",
  projectId: "safepath-87f4d",
  storageBucket: "safepath-87f4d.firebasestorage.app",
  messagingSenderId: "915200355322",
  appId: "1:915200355322:web:a0226fef3152918f5b1243"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const docRef = await addDoc(collection(db, "misgivings"), {
      lat: 22.7196,
      lng: 75.8577,
      type: "accident",
      severity: 4,
      timestamp: "2026-04-10T08:30:00Z",
      description: "Major accident near MG Road",
      reportedBy: "user123"
    });
    console.log("Document written with ID: ", docRef.id);
    process.exit(0);
  } catch (e) {
    console.error("Error adding document: ", e);
    process.exit(1);
  }
}

run();
