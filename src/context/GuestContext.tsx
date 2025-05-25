"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface GuestContextType {
  isGuest: boolean;
  setGuest: (value: boolean) => void;
}

const GuestContext = createContext<GuestContextType>({ isGuest: false, setGuest: () => {} });

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    setIsGuest(localStorage.getItem('isGuest') === 'true');
  }, []);

  const setGuest = (value: boolean) => {
    setIsGuest(value);
    if (value) {
      localStorage.setItem('isGuest', 'true');
    } else {
      localStorage.removeItem('isGuest');
    }
  };

  return (
    <GuestContext.Provider value={{ isGuest, setGuest }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  return useContext(GuestContext);
} 