"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

type UserType = ReturnType<typeof useUser>["user"];

type UserContextValue = {
  isSignedIn: boolean;
  userId: string | null;
  email: string | null;
  user: UserType;
};

const UserContext = createContext<UserContextValue>({
  isSignedIn: false,
  userId: null,
  email: null,
  user: null,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser();
  const value = useMemo<UserContextValue>(() => {
    const email = user?.primaryEmailAddress?.emailAddress ?? null;
    return {
      isSignedIn: Boolean(isSignedIn),
      userId: user?.id ?? null,
      email,
      user: user ?? null,
    };
  }, [isSignedIn, user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  return useContext(UserContext);
}


