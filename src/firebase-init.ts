import { initializeApp, getApps, FirebaseOptions } from "firebase/app";

/**
 * Initialize the Firebase app / database
 * const config = {
 *   apiKey: "YOUR_API_KEY",
 *   authDomain: "your-app.firebaseapp.com",
 *   projectId: "your-app",
 *   storageBucket: "your-app.appspot.com",
 *   messagingSenderId: "80085",
 *   appId: "1:80085:web:80085",
 *   measurementId: "G-ASDF",
 * };
 * @param config FirebaseOptions
 * @returns boolean
 */
export function initDatabase(config: FirebaseOptions): boolean {
  if (getApps().length === 0) {
    initializeApp(config);
    return true;
  }
  return false;
}
