"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="w-full border-b bg-background/60 supports-[backdrop-filter]:bg-background/40 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-semibold tracking-tight">
            PostAPI
          </Link>
          <nav className="hidden md:flex items-center gap-6 ml-8 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground">Features</Link>
            <Link href="#pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="#docs" className="hover:text-foreground">Docs</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton>
              <Button variant="ghost">Sign in</Button>
            </SignInButton>
            <SignUpButton>
              <Button>Get started</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}


