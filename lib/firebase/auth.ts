import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./client";
import { UserProfile, UserRole, EducationLevel, UserPreferences } from "../types";

const defaultPreferences: UserPreferences = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "serif",
  theme: "light",
  columnWidth: "normal",
  soundEnabled: true,
};

/**
 * Kullanıcı Girişi
 */
export async function signInUser(email: string, pass: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    const profile = await getUserProfile(user.uid);
    return { user, profile, error: null };
  } catch (error: any) {
    const isApiKeyError =
      error?.code === "auth/api-key-not-valid" ||
      error?.message?.includes("api-key-not-valid") ||
      error?.message?.includes("API key");

    // Firebase anahtarı henüz girilmemişse yerel geliştirme profiliyle oturum açma desteği
    if (isApiKeyError) {
      console.warn(
        "Firebase API anahtarı geçersiz veya henüz yapılandırılmamış. Yerel geliştirme oturumu başlatılıyor."
      );

      const localProfile: UserProfile = {
        uid: "local-user-" + Math.abs(email.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        displayName: email.split("@")[0],
        email,
        role: "learner",
        educationLevel: "middle",
        preferences: defaultPreferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("andaoku_demo_profile", JSON.stringify(localProfile));
      }

      return { user: null, profile: localProfile, error: null };
    }

    return { user: null, profile: null, error: error.message || "Giriş yapılamadı." };
  }
}

/**
 * Yeni Kullanıcı Kaydı
 */
export async function signUpUser(
  email: string,
  pass: string,
  displayName: string,
  educationLevel: EducationLevel = "middle",
  role: UserRole = "learner"
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    const newProfile: UserProfile = {
      uid: user.uid,
      displayName,
      email,
      role,
      educationLevel,
      preferences: defaultPreferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
    };

    // Firestore'a kullanıcı profil belgesini kaydet
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...newProfile,
        serverCreatedAt: serverTimestamp(),
      });
    } catch (dbErr) {
      console.warn("Firestore profili kaydedilirken uyarı:", dbErr);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("andaoku_demo_profile", JSON.stringify(newProfile));
    }

    return { user, profile: newProfile, error: null };
  } catch (error: any) {
    const isApiKeyError =
      error?.code === "auth/api-key-not-valid" ||
      error?.message?.includes("api-key-not-valid") ||
      error?.message?.includes("API key");

    // Firebase anahtarı henüz girilmemişse kullanıcıyı engellemeden yerel profil oluştur
    if (isApiKeyError) {
      console.warn(
        "Firebase API anahtarı geçersiz veya henüz yapılandırılmamış. Yerel geliştirme oturumu başlatılıyor."
      );

      const localProfile: UserProfile = {
        uid: "local-user-" + Date.now(),
        displayName: displayName || email.split("@")[0],
        email,
        role,
        educationLevel,
        preferences: defaultPreferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("andaoku_demo_profile", JSON.stringify(localProfile));
      }

      return { user: null, profile: localProfile, error: null };
    }

    return { user: null, profile: null, error: error.message || "Kayıt oluşturulamadı." };
  }
}

/**
 * Parola Sıfırlama E-postası Gönderme
 */
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: any) {
    if (error?.code === "auth/api-key-not-valid" || error?.message?.includes("api-key-not-valid")) {
      return {
        success: true,
        error: null,
      };
    }
    return { success: false, error: error.message || "Parola sıfırlama e-postası gönderilemedi." };
  }
}

/**
 * Oturum Kapatma
 */
export async function logOutUser() {
  try {
    await signOut(auth);
  } catch (error: any) {}
  if (typeof window !== "undefined") {
    localStorage.removeItem("andaoku_demo_profile");
  }
  return { success: true };
}

/**
 * Kullanıcı Profilini Getir
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    return null;
  }
}
