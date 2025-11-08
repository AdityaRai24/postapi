import type { Metadata } from "next";
import {  Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from '@clerk/themes'
import { UserProvider } from "@/components/user-provider";

const loraFont = Lora({
  variable: "--font-lora",
  subsets: ["cyrillic", "latin"],
});


export const metadata: Metadata = {
  title: "PostAPI - Build, host, and share APIs in minutes",
  description: "PostAPI is a simple platform to create endpoints, manage keys, and deploy with zero ops. Collaborate with your team and let developers integrate fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{baseTheme: dark}} 
      signInUrl="/sign-in" 
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${loraFont.className}  antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <UserProvider>
              <Navbar />
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  },
                  success: {
                    iconTheme: {
                      primary: 'hsl(142, 76%, 36%)',
                      secondary: 'white',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'hsl(0, 84%, 60%)',
                      secondary: 'white',
                    },
                  },
                }}
              />
            </UserProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
