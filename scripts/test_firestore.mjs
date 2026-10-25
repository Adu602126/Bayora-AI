import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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
    console.log("Adding a test document to 'incidents'...");
    const docRef = await addDoc(collection(db, "incidents"), {
      lat: 22.7196,
      lng: 75.8577,
      type: "accident",
      severity: 4,
      timestamp: new Date().toISOString(), // Use current timestamp so it falls within the last 2 months for SafeMap
      description: "Major accident near MG Road",
      reportedBy: "user123"
    });
    console.log("✅ Document written with ID:", docRef.id);

    console.log("\nReading from 'incidents'...");
    const q = query(collection(db, "incidents"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No documents found in 'incidents'.");
    } else {
      console.log(`✅ Found ${snapshot.docs.length} documents:`);
      snapshot.forEach(doc => {
        console.log(` - [${doc.id}]`, doc.data());
      });
    }

    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e);
    process.exit(1);
  }
}

run();
