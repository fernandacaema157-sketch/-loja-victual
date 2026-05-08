import { useUser } from "@clerk/react";

const ADMIN_EMAILS = ["estagiariocaema17@gmail.com"];

export function useIsAdmin(): boolean {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return false;
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? "";
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
