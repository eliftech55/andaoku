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
import { auth, db, isFirebaseConfigured } from "./client";
import { UserProfile, UserRole, EducationLevel, UserPreferences } from "../types";

const defaultPreferences: UserPreferences = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "serif",
  theme: "light",
  columnWidth: "normal",
  soundEnabled: true,
};

function getAuthErrorMessage(error: unknown, action: "login" | "signup" | "reset") {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code === "auth/api-key-not-valid") {
    return "Firebase yapılandırması geçersiz. Vercel ortam değişkenlerini kontrol edip yeniden dağıtım yapın.";
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "E-posta adresi veya parola yanlış.";
  }
  if (code === "auth/email-already-in-use") {
    return "Bu e-posta adresiyle zaten bir hesap oluşturulmuş.";
  }
  if (code === "auth/invalid-email") {
    return "Geçerli bir e-posta adresi girin.";
  }
  if (code === "auth/weak-password") {
    return "Parola en az 6 karakter olmalıdır.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Firebase Console'da e-posta ve parola ile giriş yöntemini etkinleştirin.";
  }
  if (code === "auth/too-many-requests") {
    return "Çok fazla deneme yapıldı. Bir süre bekleyip tekrar deneyin.";
  }

  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
  if (message) return message;

  if (action === "login") return "Giriş yapılamadı. Lütfen tekrar deneyin.";
  if (action === "signup") return "Kayıt oluşturulamadı. Lütfen tekrar deneyin.";
  return "Parola sıfırlama e-postası gönderilemedi.";
}

/**
 * Kullanıcı Girişi
 */
export async function signInUser(email: string, pass: string) {
  if (!isFirebaseConfigured) {
    return {
      user: null,
      profile: null,
      error: "Firebase yapılandırması eksik. Vercel'de NEXT_PUBLIC_FIREBASE_ değişkenlerini tanımlayıp yeniden dağıtım yapın.",
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    const profile = await getUserProfile(user.uid);
    return { user, profile, error: null };
  } catch (error: unknown) {
    return { user: null, profile: null, error: getAuthErrorMessage(error, "login") };
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
  if (!isFirebaseConfigured) {
    return {
      user: null,
      profile: null,
      error: "Firebase yapılandırması eksik. Vercel'de NEXT_PUBLIC_FIREBASE_ değişkenlerini tanımlayıp yeniden dağıtım yapın.",
    };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    void updateProfile(user, { displayName }).catch((error: unknown) => {
      console.warn("Firebase hesabı oluşturuldu ancak görünen ad güncellenemedi:", error);
    });

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

    void setDoc(doc(db, "users", user.uid), {
      ...newProfile,
      serverCreatedAt: serverTimestamp(),
    }).catch((dbErr: unknown) => {
      console.error("Firebase hesabı oluşturuldu ancak Firestore profili kaydedilemedi:", dbErr);
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("andaoku_demo_profile", JSON.stringify(newProfile));
      } catch (storageError) {
        console.warn("Firebase hesabı oluşturuldu ancak profil tarayıcıya kaydedilemedi:", storageError);
      }
    }

    return { user, profile: newProfile, error: null };
  } catch (error: unknown) {
    return { user: null, profile: null, error: getAuthErrorMessage(error, "signup") };
  }
}

/**
 * Parola Sıfırlama E-postası Gönderme
 */
export async function resetPassword(email: string) {
  if (!isFirebaseConfigured) {
    return {
      success: false,
      error: "Firebase yapılandırması eksik. Vercel ortam değişkenlerini kontrol edip yeniden dağıtım yapın.",
    };
  }

  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: unknown) {
    return { success: false, error: getAuthErrorMessage(error, "reset") };
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
