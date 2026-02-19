"use client"; // Required for state (copy button) and framer-motion

import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  ArrowRight,
} from "lucide-react";

//=================================================================
// Footer Component
//=================================================================
function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-20 lg:px-8">
        <div className="flex flex-col-reverse justify-between gap-12 md:flex-row">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <DatabaseZap className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight">PostAPI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              © {new Date().getFullYear()} PostAPI. Building the future of API development, one endpoint at a time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-foreground">Product</p>
              <nav className="mt-4 flex flex-col gap-3">
                <Link
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/docs"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Documentation
                </Link>
              </nav>
            </div>
            <div>
              <p className="font-semibold text-foreground">Company</p>
              <nav className="mt-4 flex flex-col gap-3">
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Careers
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </nav>
            </div>
            <div>
              <p className="font-semibold text-foreground">Legal</p>
              <nav className="mt-4 flex flex-col gap-3">
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-16 flex items-center justify-between border-t pt-8">
          <p className="text-xs text-muted-foreground">
            Crafted with passion by the PostAPI team.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
          </div>
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
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          {icon}
        </div>
        <h3 className="mb-2 text-xl font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      <main className="relative flex flex-col items-center">
        {/* ======================= */}
        {/* Hero Section */}
        {/* ======================= */}
        <section className="w-full px-6 pt-24 md:pt-32 lg:pt-40 pb-20 md:pb-32">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="flex flex-col lg:flex-row items-center gap-16"
            >
              <div className="flex-2 space-y-4 text-center lg:text-left">
                <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium text-foreground shadow-sm bg-background/50 backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  Now in public beta
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                  Build APIs <br className="hidden lg:block" />
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    in minutes, not days.
                  </span>
                </motion.h1>

                <motion.p variants={itemVariants} className="mx-auto lg:mx-0 max-w-2xl text-xl text-muted-foreground leading-relaxed">
                  PostAPI abstracts away infrastructure so you can focus on shipping.
                  Create endpoints, manage keys, and scale globally without touching a server.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button asChild size="lg" className="h-12 px-8 text-base">
                    <Link href="/dashboard">
                      Start Building Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm">
                    <Link href="/docs">Read Documentation</Link>
                  </Button>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="flex-1  max-w-xl lg:max-w-none">
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-purple-600/30 opacity-70 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
                  <div className="relative rounded-xl border bg-card/95 backdrop-blur shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/80" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                        <div className="h-3 w-3 rounded-full bg-green-500/80" />
                      </div>
                      <div className="text-xs font-medium text-muted-foreground font-mono">bash</div>
                    </div>
                    <div className="relative p-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">Copy code</span>
                      </Button>
                      <pre className="overflow-x-auto rounded-lg bg-black/5 dark:bg-black/40 p-4 text-sm font-mono leading-relaxed">
                        <code className="block text-foreground">
                          {codeString}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ======================= */}
        {/* Features Section */}
        {/* ======================= */}
        <section
          id="features"
          className="w-full px-6 py-24 md:py-32 bg-muted/30"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-6 text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Everything you need to <span className="text-primary">scale</span>
              </h2>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Powerful features designed for developer happiness. From local development to global scale, we've got you covered.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              <motion.div variants={itemVariants}>
                <Feature
                  icon={<ServerOff className="h-6 w-6" />}
                  title="Serverless Architecture"
                  desc="Forget about servers, clusters, and load balancers. Deploy code instantly and let us handle the infrastructure."
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <Feature
                  icon={<ShieldCheck className="h-6 w-6" />}
                  title="Enterprise Security"
                  desc="Built-in DDoS protection, automatic SSL, and per-endpoint API keys. Your data is secure by default."
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <Feature
                  icon={<BarChartHorizontal className="h-6 w-6" />}
                  title="Real-time Analytics"
                  desc="Monitor API health, track usage patterns, and debug issues with detailed real-time logs and metrics."
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <Feature
                  icon={<GitBranch className="h-6 w-6" />}
                  title="Branch Previews"
                  desc="Automatically create preview environments for every pull request. Test changes in isolation before merging."
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <Feature
                  icon={<Users className="h-6 w-6" />}
                  title="Team Collaboration"
                  desc="Invite developers, manage permissions, and collaborate on API design with shared workspaces."
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <Feature
                  icon={<Zap className="h-6 w-6" />}
                  title="Global Edge Network"
                  desc="Deploy your APIs to the edge. Serve requests from the location nearest to your users for ultra-low latency."
                />
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}