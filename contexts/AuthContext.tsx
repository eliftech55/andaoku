"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, UserRole, EducationLevel, UserPreferences } from "@/lib/types";
import { signInUser, signUpUser, logOutUser, getUserProfile } from "@/lib/firebase/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    pass: string,
    name: string,
    educationLevel?: EducationLevel,
    role?: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
}

const defaultPreferences: UserPreferences = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "serif",
  theme: "light",
  columnWidth: "normal",
  soundEnabled: true,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  updatePreferences: async () => {},
  switchDemoRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // LocalStorage demo kullanıcısını kontrol et
    const demoProfileStr = typeof window !== "undefined" ? localStorage.getItem("andaoku_demo_profile") : null;
    if (demoProfileStr) {
      try {
        const parsed = JSON.parse(demoProfileStr);
        setProfile(parsed);
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.uid);
        if (userProfile) {
          setProfile(userProfile);
        } else {
          // Varsayılan profil oluştur
          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "Okur",
            email: currentUser.email || "",
            role: "learner",
            educationLevel: "middle",
            preferences: defaultPreferences,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
          };
          setProfile(fallbackProfile);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem("andaoku_demo_profile");
    }
    setProfile(null);
    const { user: loggedInUser, profile: loadedProfile, error } = await signInUser(email, pass);
    setLoading(false);
    if (error || !loggedInUser) {
      setUser(null);
      return { success: false, error: error || "Firebase oturumu doğrulanamadı." };
    }
    setUser(loggedInUser);
    setProfile(loadedProfile);
    return { success: true };
  };

  const signup = async (
    email: string,
    pass: string,
    name: string,
    educationLevel: EducationLevel = "middle",
    role: UserRole = "learner"
  ) => {
    setLoading(true);
    const { user: newUser, profile: newProfile, error } = await signUpUser(
      email,
      pass,
      name,
      educationLevel,
      role
    );
    setLoading(false);
    if (error || !newUser) {
      setUser(null);
      setProfile(null);
      return { success: false, error: error || "Firebase hesabı oluşturulamadı." };
    }
    setUser(newUser);
    setProfile(newProfile);
    return { success: true };
  };

  const logout = async () => {
    await logOutUser();
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("andaoku_demo_profile");
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        ...newPrefs,
      },
    };
    setProfile(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("andaoku_demo_profile", JSON.stringify(updated));
    }
    if (user && db) {
      try {
        await setDoc(doc(db, "users", user.uid), { preferences: updated.preferences }, { merge: true });
      } catch (e) {}
    }
  };

  const switchDemoRole = (role: UserRole) => {
    const demoProf: UserProfile = {
      uid: `demo-${role}-123`,
      displayName:
        role === "learner"
          ? "Elif Okur (Öğrenci)"
          : role === "teacher"
          ? "Ahmet Öğretmen"
          : role === "content_manager"
          ? "Selin Editör"
          : role === "admin"
          ? "Yönetici Mustafa"
          : "Dr. Zeynep (Araştırmacı)",
      email: `${role}@andaoku.edu.tr`,
      role,
      educationLevel: "middle",
      preferences: defaultPreferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
    };
    setProfile(demoProf);
    if (typeof window !== "undefined") {
      localStorage.setItem("andaoku_demo_profile", JSON.stringify(demoProf));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        logout,
        updatePreferences,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
