"use client"; // Required for state (copy button) and framer-motion

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ServerOff,
  ShieldCheck,
  BarChartHorizontal,
  Copy,
  Check,
  DatabaseZap,
  Github,
  Twitter,
  GitBranch,
  Users,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

//=================================================================
// Navigation Bar Component
//=================================================================

//=================================================================
// Footer Component
//=================================================================
function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col-reverse justify-between gap-8 md:flex-row">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <DatabaseZap className="h-6 w-6" />
              <span className="text-lg font-bold">PostAPI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PostAPI. All rights reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="font-semibold">Product</p>
              <nav className="mt-4 flex flex-col gap-2">
                <Link
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Pricing
                </Link>
                <Link
                  href="/docs"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Documentation
                </Link>
              </nav>
            </div>
            <div>
              <p className="font-semibold">Company</p>
              <nav className="mt-4 flex flex-col gap-2">
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  About Us
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Careers
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Contact
                </Link>
              </nav>
            </div>
            <div>
              <p className="font-semibold">Legal</p>
              <nav className="mt-4 flex flex-col gap-2">
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-12 flex items-center justify-center gap-4">
          <Link href="#" className="text-muted-foreground hover:text-foreground">
            <Twitter className="h-5 w-5" />
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground">
            <Github className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

//=================================================================
// Feature Card Component
//=================================================================
function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-3 text-muted-foreground">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

//=================================================================
// Pricing Card Component
//=================================================================
function PricingCard({
  title,
  desc,
  price,
  period,
  features,
  isFeatured,
}: {
  title: string;
  desc: string;
  price: string;
  period: string;
  features: string[];
  isFeatured?: boolean;
}) {
  return (
    <Card className={isFeatured ? "border-primary" : ""}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={isFeatured ? "default" : "outline"}>
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}

//=================================================================
// Main Home Page Component
//=================================================================
export default function Home() {
  const [copied, setCopied] = useState(false);

  const codeString = `curl -X POST https://api.postapi.dev/projects \\
  -H "Authorization: Bearer <your-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-api"}'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Animation variants for framer-motion
  const sectionFadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { once: true },
  };

  return (
    <>
      <main className="mx-auto max-w-6xl px-4">
        {/* ======================= */}
        {/* Hero Section */}
        {/* ======================= */}
        <motion.section
          className="py-16 md:py-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col-reverse items-center gap-10 md:flex-row">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Build, host, and share APIs in minutes
              </h1>
              <p className="max-w-prose text-lg text-muted-foreground">
                PostAPI is a simple platform to create endpoints, manage keys,
                and deploy with zero ops. Collaborate with your team and let
                developers integrate fast.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                <Button asChild size="lg">
                  <Link href="/dashboard">Create your API</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/docs">View Docs</Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="relative rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                <p className="text-sm text-muted-foreground">Quick start</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4 text-muted-foreground"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy code</span>
                </Button>
                <pre className="mt-3 overflow-auto rounded-md bg-muted p-4 text-sm">
                  {codeString}
                </pre>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ======================= */}
        {/* Features Section */}
        {/* ======================= */}
        <motion.section
          id="features"
          className="py-16 md:py-24"
          {...sectionFadeIn}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need, nothing you don't
            </h2>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Powerful features to get your backend running instantly,
              so you can focus on your frontend.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<ServerOff className="h-6 w-6" />}
              title="No servers"
              desc="Deploy instantly, scale automatically. No infrastructure to manage."
            />
            <Feature
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Secure by default"
              desc="Per-endpoint keys, rate limits, and CORS-management built-in."
            />
            <Feature
              icon={<BarChartHorizontal className="h-6 w-6" />}
              title="Observability"
              desc="Real-time logs and metrics to monitor your API health and usage."
            />
            <Feature
              icon={<GitBranch className="h-6 w-6" />}
              title="Branching"
              desc="Create staging and production environments for your APIs."
            />
            <Feature
              icon={<Users className="h-6 w-6" />}
              title="Team Collaboration"
              desc="Invite your team and manage permissions for projects."
            />
            <Feature
              icon={<Zap className="h-6 w-6" />}
              title="Blazing Fast"
              desc="Globally distributed cache for low-latency responses."
            />
          </div>
        </motion.section>

        {/* ======================= */}
        {/* Pricing Section */}
        {/* ======================= */}
        <motion.section
          id="pricing"
          className="py-16 md:py-24"
          {...sectionFadeIn}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Pricing that scales with you
            </h2>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Start for free and upgrade as you grow. No hidden fees.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <PricingCard
              title="Free"
              desc="For personal projects & hobbyists"
              price="$0"
              period="/mo"
              features={[
                "1 Project",
                "2 Endpoints",
                "10,000 Requests/mo",
                "Community Support",
              ]}
            />
            <PricingCard
              title="Pro"
              desc="For growing teams & startups"
              price="$15"
              period="/mo"
              features={[
                "10 Projects",
                "Unlimited Endpoints",
                "1,000,000 Requests/mo",
                "Team Collaboration",
                "Email Support",
              ]}
              isFeatured={true}
            />
            <PricingCard
              title="Enterprise"
              desc="For large-scale applications"
              price="Custom"
              period=""
              features={[
                "Unlimited Projects",
                "Unlimited Requests",
                "Custom Rate Limits",
                "SAML/SSO",
                "Priority Support",
              ]}
            />
          </div>
        </motion.section>

        {/* ======================= */}
        {/* Final CTA Section */}
        {/* ======================= */}
        <motion.section className="py-16 md:py-24" {...sectionFadeIn}>
          <div className="rounded-lg border bg-card p-10 text-center text-card-foreground shadow-sm md:p-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to build?
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
              Start creating your first mock API in seconds. No credit card required.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/dashboard">Get Started for Free</Link>
            </Button>
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  );
}