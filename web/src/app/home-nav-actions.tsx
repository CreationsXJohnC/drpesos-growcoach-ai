"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function HomeNavActions({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Signing out...</>
          ) : (
            "Sign Out"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/login">Sign In</Link>
      </Button>
      <Button size="sm" className="glow-green" asChild>
        <Link href="/auth/signup">Start Free Trial</Link>
      </Button>
    </div>
  );
}
