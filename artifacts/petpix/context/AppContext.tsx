import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@workspace/api-client-react";

interface AppContextValue {
  userId: string;
  userName: string;
  displayName: string;
  setUserName: (name: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>("petlover");
  const [displayName, setDisplayName] = useState<string>("Pet Lover");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
    staleTime: 60000,
  });

  useEffect(() => {
    if (profile) {
      setUserName(profile.username);
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  const value = useMemo(
    () => ({
      userId: "user-001",
      userName,
      displayName,
      setUserName,
    }),
    [userName, displayName]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
