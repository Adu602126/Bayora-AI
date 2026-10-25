import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useLiveLocation = (userId: string | undefined | null) => {
  useEffect(() => {
    // Only track if we have a user ID and Firestore is initialized
    if (!userId || !db) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Push the latest coordinates to Firebase
        setDoc(doc(db, "liveLocations", userId), {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date(),
          userId
        }, { merge: true }).catch(err => {
          console.error("Error updating live location in Firebase:", err);
        });
      },
      (err) => {
        console.error("Geolocation watch error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userId]);
};
