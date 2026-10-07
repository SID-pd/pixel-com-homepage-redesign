"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getCartCount } from "../api/service/cart-service";
import { get } from "../api/service/storage";

type UserType = any;

interface UserContextType {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  countCart: any;
  setCartCount: (count: any) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [countCart, setCartCount] = useState<UserType | null>(null);

  const fetchCartCount = async () => {
    try {
      const count = await getCartCount();
      setCartCount(count || 0);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    let user = get<any>("user");
    if (user) {
      fetchCartCount();
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, countCart, setCartCount }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used inside <UserProvider>");
  }
  return context;
}
