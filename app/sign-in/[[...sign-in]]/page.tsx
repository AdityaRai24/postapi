"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 flex items-center justify-center">
      <SignIn />
    </main>
  );
}


