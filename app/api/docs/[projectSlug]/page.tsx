"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, LinkIcon, Check } from "lucide-react";

type Project = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

type Resource = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  slug: string;
  enabledMethods: string[];
  mockData?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function ApiDocsBySlugPage() {
  const params = useParams();
  const projectSlug = (params?.projectSlug as string) || "";

  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!projectSlug) return;
      setLoading(true);
      setError(null);
      try {
        // Try resolving project by slug, then resources by project id
        const projRes = await axios.get<Project>(`${API_BASE_URL}/api/projects/slug/${projectSlug}`);
        const proj = projRes.data;
        setProject(proj);
        if (proj?.id) {
          const resRes = await axios.get<Resource[]>(`${API_BASE_URL}/api/projects/${proj.id}/resources`);
          setResources(Array.isArray(resRes.data) ? resRes.data : []);
        } else {
          setResources([]);
        }
      } catch (e) {
        console.error("Failed to load docs:", e);
        setError("Could not load documentation for this project.");
        setProject(null);
        setResources([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectSlug]);

  const baseApiUrl = useMemo(() => `${API_BASE_URL}/api/${project?.slug || projectSlug}`, [project?.slug, projectSlug]);

  const methodColor: Record<string, string> = {
    GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Separator />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Documentation not found</CardTitle>
            <CardDescription>
              {error || "The project documentation you're looking for doesn't exist or is not available."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">API Documentation</h1>
          <p className="text-muted-foreground">Project: {project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(baseApiUrl);
              setCopiedKey("base");
              setTimeout(() => setCopiedKey((k) => (k === "base" ? null : k)), 2000);
            }}
            variant="secondary"
          >
            {copiedKey === "base" ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />} Copy Base URL
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
          <CardDescription>The root for all endpoints in this project.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border p-3 font-mono text-sm">
            <div className="truncate">{baseApiUrl}</div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(baseApiUrl);
                setCopiedKey("inline-base");
                setTimeout(() => setCopiedKey((k) => (k === "inline-base" ? null : k)), 2000);
              }}
            >
              {copiedKey === "inline-base" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {resources.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No resources found</CardTitle>
            <CardDescription>This project has no resources yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="space-y-6">
          {resources.map((r) => {
            // Build a minimal example from mockData if available
            let example: unknown = r.mockData;
            if (Array.isArray(example)) {
              example = example[0];
            }
            const endpoints = [
              { method: "GET", path: `/${r.slug}`, summary: `List ${r.name}` },
              { method: "POST", path: `/${r.slug}`, summary: `Create ${r.name}` },
              { method: "GET", path: `/${r.slug}/{id}`, summary: `Get ${r.name} by id` },
              { method: "PUT", path: `/${r.slug}/{id}`, summary: `Update ${r.name}` },
              { method: "DELETE", path: `/${r.slug}/{id}`, summary: `Delete ${r.name}` },
            ].filter(e => r.enabledMethods.includes(e.method === 'GET' && e.path.endsWith('{id}') ? 'GET_BY_ID' : e.method));

            return (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-semibold">{r.name}</div>
                      {r.description && (<CardDescription>{r.description}</CardDescription>)}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(`${baseApiUrl}/${r.slug}`);
                        setCopiedKey(`res-${r.id}`);
                        setTimeout(() => setCopiedKey((k) => (k === `res-${r.id}` ? null : k)), 2000);
                      }}
                    >
                      {copiedKey === `res-${r.id}` ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <LinkIcon className="h-4 w-4 mr-2" />} Copy Resource URL
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Endpoints</div>
                    <div className="flex flex-col gap-2">
                      {endpoints.map((e, idx) => (
                        <div key={idx} className="flex flex-wrap items-center justify-between rounded border p-3">
                          <div className="flex items-center gap-2">
                            <Badge className={methodColor[e.method] || "bg-muted"}>{e.method === 'GET' && e.path.endsWith('{id}') ? 'GET' : e.method}</Badge>
                            <code className="text-xs text-muted-foreground">{e.path}</code>
                            <span className="text-xs text-muted-foreground">— {e.summary}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(`${baseApiUrl}${e.path}`);
                                setCopiedKey(`ep-${r.id}-${idx}`);
                                setTimeout(() => setCopiedKey((k) => (k === `ep-${r.id}-${idx}` ? null : k)), 2000);
                              }}
                            >
                              {copiedKey === `ep-${r.id}-${idx}` ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Tabs defaultValue="example">
                    <TabsList>
                      <TabsTrigger value="example">Example Response</TabsTrigger>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="example">
                      <pre className="max-h-64 overflow-auto rounded-md border p-4 text-sm">
{JSON.stringify(example ?? { id: 1 }, null, 2)}
                      </pre>
                    </TabsContent>
                    <TabsContent value="curl">
                      <pre className="overflow-auto rounded-md border p-4 text-sm">
curl -X GET &quot;{baseApiUrl}/{r.slug}&quot; -H &quot;accept: application/json&quot;
                      </pre>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </main>
  );
}


