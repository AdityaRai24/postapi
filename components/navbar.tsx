"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { DatabaseZap } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <DatabaseZap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">PostAPI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 ml-8 text-sm font-medium text-muted-foreground">
            <Link
              href="/dashboard"
              className="hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/docs"
              className="hover:text-primary transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className="hover:text-primary transition-colors"
            >
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm">Get Started</Button>
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
