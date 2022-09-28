import { getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  User,
  Unsubscribe,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
} from "firebase/auth";

export type AuthHandler = (user: User | null) => void;

export function handleAuthState(handler: AuthHandler): Unsubscribe {
  const auth = getAuth(getApp());
  return onAuthStateChanged(auth, handler);
}

export async function login(email: string, password: string): Promise<string> {
  const auth = getAuth(getApp());
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  if (!user) {
    throw new Error("Login failed: user sign in unsuccessful");
  }
  return user.uid;
}

export async function register(
  email: string,
  password: string
): Promise<string> {
  const auth = getAuth(getApp());
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (!user) {
    throw new Error("Registration failed: user creation unsuccessful");
  }
  return user.uid;
}

export async function logout(): Promise<boolean> {
  const auth = getAuth(getApp());
  await signOut(auth);
  return true;
}

export async function sendResetPasswordEmail(email: string): Promise<boolean> {
  const auth = getAuth(getApp());
  await sendPasswordResetEmail(auth, email);
  return true;
}

export async function signInWithGoogle(): Promise<string> {
  const provider = new GoogleAuthProvider();
  const auth = getAuth(getApp());
  await signInWithRedirect(auth, provider);
  const result = await getRedirectResult(auth);
  if (!result) {
    throw new Error("User cancelled redirect sign in");
  }
  if (!result.user) {
    throw new Error("Login failed: user sign in unsuccessful");
  }
  return result.user.uid;
}

export function mobileSignInWithGoogle(idToken: string): void {
  const auth = getAuth(getApp());
  const credential = GoogleAuthProvider.credential(idToken);
  signInWithCredential(auth, credential);
}

export async function deleteAuthUser(): Promise<boolean> {
  const auth = getAuth(getApp());
  const user = auth.currentUser;
  if (!user) return false;
  await deleteUser(user);
  return true;
}
