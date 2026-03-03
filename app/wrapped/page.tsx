import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { WrappedView } from "./wrapped-view";

export const metadata = {
  title: "Your Expense Wrapped",
  description: "Your monthly spending recap",
};

export default async function WrappedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const userName = session.user.name || "there";

  return (
    <div className="min-h-screen bg-background">
      <WrappedView userName={userName} />
    </div>
  );
}
