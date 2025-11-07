import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <section className="text-center md:text-left flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            Build, host, and share APIs in minutes
          </h1>
          <p className="text-lg text-muted-foreground max-w-prose">
            PostAPI is a simple platform to create endpoints, manage keys, and deploy
            with zero ops. Collaborate with your team and let developers integrate
            fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Create your API</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">Get started</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <Feature title="No servers" desc="Deploy instantly, scale automatically." />
            <Feature title="Secure by default" desc="Per-endpoint keys and rate limits." />
            <Feature title="Observability" desc="Logs and metrics built-in." />
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Quick start</p>
            <pre className="mt-3 rounded-md bg-muted p-4 overflow-auto text-sm">
{`curl -X POST https://api.postapi.dev/projects \\\n+  -H "Authorization: Bearer <your-key>" \\\n+  -H "Content-Type: application/json" \\\n+  -d '{"name":"my-api"}'`}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
