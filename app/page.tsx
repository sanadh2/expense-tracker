import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";

import { ExpenseDashboard } from "./components/expense-dashboard";
import { AuthStatus } from "./auth-status";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-border/40 bg-card/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
            <h1 className="text-lg font-semibold tracking-tight">
              Expense Tracker
            </h1>
            <AuthStatus />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
          <div>
            <p className="text-muted-foreground text-sm">
              Welcome back,{" "}
              <strong className="text-foreground">{session.user.name}</strong>
            </p>
          </div>

          <ExpenseDashboard />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-10 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Expense Tracker
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground leading-relaxed">
            Track your spending and take control of your finances.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-card px-8 font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
