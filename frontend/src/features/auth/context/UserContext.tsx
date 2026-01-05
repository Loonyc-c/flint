"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import { User } from "@shared/types";

interface AuthTokenPayload {
  sub: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
  data: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "flint_access_token";

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodeAndSetUser = useCallback((token: string) => {
    try {
      const decoded = jwtDecode<AuthTokenPayload>(token);

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        return;
      }

      setUser({
        id: decoded.data.userId,
        firstName: decoded.data.firstName,
        lastName: decoded.data.lastName,
        email: decoded.data.email,
        name: `${decoded.data.lastName} ${decoded.data.firstName}`,
      });
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem(STORAGE_KEY);
      if (token) {
        decodeAndSetUser(token);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [decodeAndSetUser]);

  const login = (token: string) => {
    localStorage.setItem(STORAGE_KEY, token);
    decodeAndSetUser(token);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
