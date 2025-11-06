"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

type Endpoint = {
  id: string;
  projectId?: string | null;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  slug: string;
  responseJson?: unknown;
  mockData?: unknown;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  description?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function ConfigureEndpointPage() {
  const params = useSearchParams();
  const router = useRouter();
  const projectId = params.get("projectId");
  const endpointId = params.get("endpointId");
  const { user } = useUser();
  const userPrefix = (user?.primaryEmailAddress?.emailAddress || "guest").split("@")[0];

  const [method, setMethod] = React.useState<Endpoint["method"]>("GET");
  const [slug, setSlug] = React.useState("");
  const [jsonText, setJsonText] = React.useState("{\n  \"hello\": \"world\"\n}");
  const [projectName, setProjectName] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const basePreview = `${API_BASE_URL}/${userPrefix}/`;
  const fullUrl = basePreview + (slug || "<your-endpoint>");

  React.useEffect(() => {
    const abortController = new AbortController();
    async function load() {
      try {
        if (projectId) {
          const proj = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, { signal: abortController.signal });
          if (proj.ok) {
            const p = await proj.json();
            setProjectName(p?.name || "");
          }
        }
        if (projectId && endpointId) {
          const ep = await fetch(`${API_BASE_URL}/api/projects/${projectId}/endpoints/${endpointId}`, { signal: abortController.signal });
          if (ep.ok) {
            const e: Endpoint = await ep.json();
            setMethod((e.method as Endpoint["method"]) || "GET");
            setSlug(e.slug || "");
            setJsonText(JSON.stringify((e.responseJson ?? e.mockData ?? {}), null, 2));
          }
        }
      } catch {}
    }
    load();
    return () => abortController.abort();
  }, [endpointId, projectId]);

  async function saveEndpoint() {
    setError(null);
    setSaved(false);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError("Invalid JSON. Please fix and try again.");
      return;
    }
    if (!projectId) return;
    try {
      const payload = {
        name: slug.trim(),
        description: "",
        slug: slug.trim(),
        method,
        responseJson: parsed,
        mockData: null,
      };
      await axios.post(`${API_BASE_URL}/api/projects/${projectId}/endpoints`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setSaved(true);
      router.push(`/dashboard/${projectId}`);
    } catch (e) {
      setError("Failed to save the endpoint. Please try again.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configure endpoint</h1>
        <p className="text-muted-foreground">Project: {projectName || "(unspecified)"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Method</CardTitle>
          <CardDescription>Select an HTTP method. Only GET works for now.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={method} onValueChange={(v) => setMethod(v as Endpoint["method"]) }>
            <TabsList>
              <TabsTrigger value="GET">GET</TabsTrigger>
              <TabsTrigger value="POST" disabled>POST</TabsTrigger>
              <TabsTrigger value="PUT" disabled>PUT</TabsTrigger>
              <TabsTrigger value="DELETE" disabled>DELETE</TabsTrigger>
              <TabsTrigger value="PATCH" disabled>PATCH</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint</CardTitle>
          <CardDescription>
            Your endpoint will be: <code className="text-xs bg-muted px-1 py-0.5 rounded">{fullUrl}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <label className="text-sm">Editable part</label>
          <Input
            placeholder="e.g. users"
            value={slug}
            onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-"))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response JSON</CardTitle>
          <CardDescription>Upload or paste the JSON to return from this endpoint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={12} value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? <p className="text-sm text-green-600">Endpoint created.</p> : null}
          <div className="flex gap-2">
            <Button onClick={saveEndpoint} disabled={method !== "GET" || !slug.trim()}>Save endpoint</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}


