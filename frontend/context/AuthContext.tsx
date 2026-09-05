"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  _id: string;
  fullName: string;
  email: string;
  currency: string;
  monthlyIncome: number;
  isOnboarded: boolean;
  onboardingStep: number;
  isDemoUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateOnboarding: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/login", "/signup", "/"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/login") || pathname.startsWith("/signup"));

    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && !user.isOnboarded && pathname !== "/onboarding") {
      router.replace("/onboarding");
    } else if (user && user.isOnboarded && (pathname === "/login" || pathname === "/signup")) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: any) => {
    const res = await api.auth.login(credentials);
    setUser(res.data.user);
    if (!res.data.user.isOnboarded) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
  };

  const signup = async (userData: any) => {
    const res = await api.auth.signup(userData);
    setUser(res.data.user);
    router.push("/onboarding");
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await api.auth.demoLogin();
      setUser(res.data.user);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  const updateOnboarding = async (data: any) => {
    const res = await api.auth.updateOnboarding(data);
    setUser(res.data.user);
    if (res.data.user.isOnboarded) {
      router.push("/dashboard");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        demoLogin,
        logout,
        updateOnboarding,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
