import { initializeApp, getApps, FirebaseOptions } from "firebase/app";

/**
 * Initialize the Firebase app / database.
 * Example config parameter:
 * const config = {
 *   apiKey: "YOUR_API_KEY",
 *   authDomain: "your-app.firebaseapp.com",
 *   projectId: "your-app",
 *   storageBucket: "your-app.appspot.com",
 *   messagingSenderId: "12345",
 *   appId: "1:12345:web:12345",
 *   measurementId: "G-ASDF",
 * };
 * @param {FirebaseOptions} config FirebaseOptions
 * @returns {boolean} boolean
 */
export function initDatabase(config: FirebaseOptions): boolean {
  if (getApps().length === 0) {
    initializeApp(config);
    return true;
  }
  return false;
}
