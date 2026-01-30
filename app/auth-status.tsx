"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/hooks";

export function AuthStatus() {
  const { data: session, isPending } = authClient.useSession();
  const { signOut } = useAuth();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {session.user.name}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            signOut.mutate(undefined, {
              onSuccess: () => window.location.reload(),
            })
          }
          disabled={signOut.isPending}
        >
          {signOut.isPending ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    );
  }

  return (
    <Button asChild size="sm">
      <Link href="/login">Sign in</Link>
    </Button>
  );
}
