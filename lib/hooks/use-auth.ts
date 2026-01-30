"use client";

import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const signIn = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { error } = await authClient.signIn.email({
        ...credentials,
        callbackURL: "/",
      });
      if (error) {
        throw new Error(error.message);
      }
    },
  });

  const signUp = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
    }) => {
      const { error } = await authClient.signUp.email({
        ...data,
        callbackURL: "/",
      });
      if (error) {
        throw new Error(error.message);
      }
    },
  });

  const signOut = useMutation({
    mutationFn: () => authClient.signOut(),
  });

  return { signIn, signUp, signOut };
}
