import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";

interface AppContextValue {
  userId: string;
  userName: string;
  setUserName: (name: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>("petlover");

  const value = useMemo(
    () => ({
      userId: "user-001",
      userName,
      setUserName,
    }),
    [userName]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
