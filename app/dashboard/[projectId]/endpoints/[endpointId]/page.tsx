"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { Save, ArrowLeft, Trash2, Settings, Check, Copy } from "lucide-react";
import axios from "axios";
import ReactCodeMirror, { oneDark } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";

type Project = {
  id: string;
  name: string;
  description?: string;
  deployedLink?: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Endpoint = {
  id: string;
  name?: string;
  description?: string;
  method: string;
  slug: string;
  responseJson?: unknown;
  mockData?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function EditEndpointPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const endpointId = params?.endpointId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const userPrefix = (user?.primaryEmailAddress?.emailAddress || "guest").split("@")[0];

  // Form state
  const [method, setMethod] = useState<Endpoint["method"]>("GET");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [jsonText, setJsonText] = useState("{\n  \"hello\": \"world\"\n}");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const [projectRes, endpointRes] = await Promise.all([
          axios.get<Project>(`${API_BASE_URL}/api/projects/${projectId}`),
          axios.get<Endpoint>(`${API_BASE_URL}/api/projects/${projectId}/endpoints/${endpointId}`),
        ]);
        if (cancelled) return;
        const p = projectRes.data;
        const e = endpointRes.data;
        setProject(p ?? null);
        setEndpoint(e ?? null);
        if (e) {
          setMethod((e.method as Endpoint["method"]) || "GET");
          setSlug(e.slug || "");
          setDescription(e.description || "");
          setJsonText(JSON.stringify((e.responseJson ?? e.mockData ?? {}), null, 2));
          setName(e.name || (e.slug ? e.slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : ""));
        }
      } catch (err) {
        console.error("Failed to load project/endpoint from API:", err);
        if (!cancelled) {
          setProject(null);
          setEndpoint(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, endpointId]);

  // Auto-generate slug from name
  useEffect(() => {
    if (name) {
      setSlug(name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  }, [name]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p>Loading endpoint…</p>
      </main>
    );
  }

  if (!project || !endpoint) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-muted-foreground">Project or endpoint not found.</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </main>
    );
  }

  const basePreview = `${API_BASE_URL}/${userPrefix}/`;
  const fullUrl = basePreview + (slug || "<your-endpoint>");

  function saveEndpoint() {
    setError(null);
    setSaved(false);
    try {
      JSON.parse(jsonText);
    } catch {
      setError("Invalid JSON. Please fix and try again.");
      return;
    }
    toast.error("Updating endpoints is not available yet.");
  }

  function deleteEndpoint() {
    toast.error("Deleting endpoints is not available yet.");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/${projectId}`}>{project.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Endpoint</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Edit endpoint</h1>
        <p className="text-muted-foreground">Project: {project.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel - Form */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Details</CardTitle>
            <CardDescription>Update your endpoint settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value as Endpoint["method"])}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="GET">GET</option>
                <option value="POST" disabled>POST (coming soon)</option>
                <option value="PUT" disabled>PUT (coming soon)</option>
                <option value="DELETE" disabled>DELETE (coming soon)</option>
                <option value="PATCH" disabled>PATCH (coming soon)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Endpoint Name</Label>
              <Input
                id="name"
                placeholder="e.g. Get Users"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                placeholder="e.g. users"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                URL: <code className="bg-muted px-1 py-0.5 rounded">{fullUrl}</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this endpoint does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={saveEndpoint} disabled={!name.trim() || !slug.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Update Endpoint
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteEndpoint}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right panel - JSON Editor/Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Response JSON</CardTitle>
                <CardDescription>Update the JSON response for this endpoint</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonText);
                      setJsonText(JSON.stringify(parsed, null, 2));
                      setError(null);
                      toast.success("JSON formatted!");
                    } catch {
                      toast.error("Invalid JSON. Cannot format.");
                    }
                  }}
                  title="Format JSON"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(jsonText);
                    setCopied(true);
                    toast.success("JSON copied to clipboard!");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  title="Copy JSON"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <ReactCodeMirror
                    value={jsonText}
                    height="500px"
                    extensions={[json()]}
                    theme={isDarkMode ? oneDark : undefined}
                    onChange={(value) => {
                      setJsonText(value);
                      if (error) {
                        try {
                          JSON.parse(value);
                          setError(null);
                        } catch {
                          // Keep error if still invalid
                        }
                      }
                    }}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                      dropCursor: false,
                      allowMultipleSelections: false,
                      indentOnInput: true,
                      bracketMatching: true,
                      closeBrackets: true,
                      autocompletion: false,
                      highlightSelectionMatches: true,
                    }}
                    placeholder="Enter JSON response..."
                    className="text-sm"
                  />
                </div>
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md mt-3">
                    <p className="text-sm text-destructive font-medium">JSON Error</p>
                    <p className="text-xs text-destructive/80 mt-1">{error}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <CodeMirror
                    value={(() => {
                      try {
                        return JSON.stringify(JSON.parse(jsonText), null, 2);
                      } catch {
                        return "Invalid JSON";
                      }
                    })()}
                    height="500px"
                    extensions={[json()]}
                    theme={isDarkMode ? oneDark : undefined}
                    editable={false}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                    }}
                    className="text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg">
          Endpoint updated! Redirecting...
        </div>
      )}
    </main>
  );
}
