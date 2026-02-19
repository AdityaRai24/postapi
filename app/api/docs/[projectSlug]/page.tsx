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
import { Copy, LinkIcon, Check, BookOpen, Code2, Terminal, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import toast from 'react-hot-toast';

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
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [selectedExample, setSelectedExample] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);

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
          const loadedResources = Array.isArray(resRes.data) ? resRes.data : [];
          setResources(loadedResources);
          // Expand first resource by default
          if (loadedResources.length > 0) {
            setExpandedResources(new Set([loadedResources[0].id]));
          }
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

  const toggleResource = (resourceId: string) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  };

  const generateCodeExample = (method: string, path: string, resource: Resource, example?: unknown) => {
    const fullUrl = `${baseApiUrl}${path}`;
    const exampleData = example || (Array.isArray(resource.mockData) ? resource.mockData[0] : resource.mockData);

    switch (selectedExample[`${resource.id}-${method}`] || 'curl') {
      case 'curl':
        if (method === 'GET') {
          return `curl -X GET "${fullUrl}" \\\n  -H "accept: application/json"`;
        } else if (method === 'POST') {
          return `curl -X POST "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "accept: application/json" \\\n  -d '${JSON.stringify(exampleData || {}, null, 2)}'`;
        } else if (method === 'PUT') {
          return `curl -X PUT "${fullUrl.replace('{id}', '1')}" \\\n  -H "Content-Type: application/json" \\\n  -H "accept: application/json" \\\n  -d '${JSON.stringify(exampleData || {}, null, 2)}'`;
        } else if (method === 'DELETE') {
          return `curl -X DELETE "${fullUrl.replace('{id}', '1')}" \\\n  -H "accept: application/json"`;
        }
        return `curl -X ${method} "${fullUrl}" \\\n  -H "accept: application/json"`;

      case 'javascript':
        if (method === 'GET') {
          return `fetch('${fullUrl}')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
        } else if (method === 'POST') {
          return `fetch('${fullUrl}', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify(${JSON.stringify(exampleData || {}, null, 2)})\n})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
        } else if (method === 'PUT') {
          return `fetch('${fullUrl.replace('{id}', '1')}', {\n  method: 'PUT',\n  headers: {\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify(${JSON.stringify(exampleData || {}, null, 2)})\n})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
        } else if (method === 'DELETE') {
          return `fetch('${fullUrl.replace('{id}', '1')}', {\n  method: 'DELETE'\n})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
        }
        return `fetch('${fullUrl}', { method: '${method}' })`;

      case 'python':
        if (method === 'GET') {
          return `import requests\n\nresponse = requests.get('${fullUrl}')\nprint(response.json())`;
        } else if (method === 'POST') {
          return `import requests\n\nresponse = requests.post(\n    '${fullUrl}',\n    json=${JSON.stringify(exampleData || {}, null, 2)}\n)\nprint(response.json())`;
        } else if (method === 'PUT') {
          return `import requests\n\nresponse = requests.put(\n    '${fullUrl.replace('{id}', '1')}',\n    json=${JSON.stringify(exampleData || {}, null, 2)}\n)\nprint(response.json())`;
        } else if (method === 'DELETE') {
          return `import requests\n\nresponse = requests.delete('${fullUrl.replace('{id}', '1')}')\nprint(response.json())`;
        }
        return `import requests\n\nresponse = requests.${method.toLowerCase()}('${fullUrl}')`;

      default:
        return '';
    }
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
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg backdrop-blur-sm border border-primary/20">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight gradient-text">API Documentation</h1>
            </div>
            <div className="flex items-center gap-2 ml-1">
              <p className="text-lg font-medium text-foreground/90">{project.name}</p>
              {project.description && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">{project.description}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="bg-background/50 backdrop-blur-sm">
              <Link href="/dashboard">
                <ExternalLink className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button
              onClick={() => copyToClipboard(baseApiUrl, "base")}
              variant="secondary"
              className="bg-secondary/50 backdrop-blur-sm hover:bg-secondary/70"
            >
              {copiedKey === "base" ? (
                <Check className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy Base URL
            </Button>
          </div>
        </div>
      </header>

      <Card className="bg-card/40 backdrop-blur-md border-muted-foreground/10 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LinkIcon className="h-4 w-4 text-primary" />
            Base URL
          </CardTitle>
          <CardDescription>The root URL for all endpoints in this project. Use this as the prefix for all API calls.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 p-4 font-mono text-sm shadow-inner">
            <code className="flex-1 break-all text-primary">{baseApiUrl}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(baseApiUrl, "inline-base")}
              className="ml-2 shrink-0 hover:bg-primary/10 hover:text-primary"
            >
              {copiedKey === "inline-base" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-border/40" />

      {resources.length === 0 ? (
        <Card className="border-dashed bg-muted/20 border-muted-foreground/20 max-w-2xl mx-auto">
          <CardHeader className="text-center py-12">
            <div className="p-4 bg-background/50 rounded-full w-fit mx-auto mb-4 border border-border/50">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No resources found</CardTitle>
            <CardDescription className="mt-2 max-w-md mx-auto">
              This project has no resources yet. Create resources in your dashboard to see them here.
            </CardDescription>
            <Button asChild className="mt-6 w-fit mx-auto">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Resources</h2>
            <Badge variant="secondary" className="bg-secondary/50 backdrop-blur-sm">{resources.length} resource{resources.length !== 1 ? 's' : ''}</Badge>
          </div>

          <div className="grid gap-4">
            {resources.map((r) => {
              // Build a minimal example from mockData if available
              let example: unknown = r.mockData;
              if (Array.isArray(example)) {
                example = example[0];
              }

              const endpoints = [
                { method: "GET", path: `/${r.slug}`, summary: `List all ${r.name}`, id: 'GET' },
                { method: "POST", path: `/${r.slug}`, summary: `Create a new ${r.name}`, id: 'POST' },
                { method: "GET", path: `/${r.slug}/{id}`, summary: `Get ${r.name} by ID`, id: 'GET_BY_ID' },
                { method: "PUT", path: `/${r.slug}/{id}`, summary: `Update ${r.name}`, id: 'PUT' },
                { method: "DELETE", path: `/${r.slug}/{id}`, summary: `Delete ${r.name}`, id: 'DELETE' },
              ].filter(e => r.enabledMethods.includes(e.id));

              const isExpanded = expandedResources.has(r.id);

              return (
                <Card key={r.id} className={`overflow-hidden transition-all duration-200 border-muted-foreground/10 ${isExpanded ? 'bg-card/60 backdrop-blur-md shadow-md ring-1 ring-primary/20' : 'bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:shadow-sm'}`}>
                  <CardHeader
                    className="cursor-pointer transition-colors p-6"
                    onClick={() => toggleResource(r.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <CardTitle className="text-xl font-semibold">{r.name}</CardTitle>
                          <Badge variant="outline" className="ml-2 bg-background/50 backdrop-blur-sm text-xs border-primary/20 text-primary">
                            {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {r.description && (
                          <CardDescription className="ml-8">{r.description}</CardDescription>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(`${baseApiUrl}/${r.slug}`, `res-${r.id}`);
                        }}
                      >
                        {copiedKey === `res-${r.id}` ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-6 pt-0 px-6 pb-6">
                      <Separator className="mb-6 bg-border/50" />
                      {endpoints.map((e, idx) => {
                        const endpointKey = `${r.id}-${e.method}-${idx}`;
                        const codeExample = generateCodeExample(e.method, e.path, r, example);

                        // Method Colors (Consistent with Dashboard)
                        const badgeVariant =
                          e.method === "GET" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20" :
                            e.method === "POST" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20" :
                              e.method === "PUT" ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20" :
                                e.method === "DELETE" ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20" :
                                  "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";

                        return (
                          <div key={idx} className="border border-border/50 rounded-lg overflow-hidden bg-background/40">
                            <div className="p-4 flex items-center justify-between gap-4 bg-muted/30 border-b border-border/50">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge variant="outline" className={`${badgeVariant} border font-mono font-bold tracking-wider`}>
                                    {e.method}
                                  </Badge>
                                  <code className="text-sm font-mono text-foreground/90 break-all">
                                    {e.path}
                                  </code>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => copyToClipboard(`${baseApiUrl}${e.path}`, `ep-${endpointKey}`)}
                              >
                                {copiedKey === `ep-${endpointKey}` ? (
                                  <Check className="h-3.5 w-3.5 text-green-600 mr-1.5" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                URL
                              </Button>
                            </div>

                            <div className="p-4 space-y-4">
                              <p className="text-sm text-muted-foreground">{e.summary}</p>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Request Section */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request</div>
                                  </div>
                                  <Tabs defaultValue="curl" className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                      <TabsList className="h-8 bg-muted/50 p-0.5">
                                        <TabsTrigger value="curl" className="text-xs h-7 data-[state=active]:bg-background/80" onClick={() => setSelectedExample(prev => ({ ...prev, [`${r.id}-${e.method}`]: 'curl' }))}>
                                          cURL
                                        </TabsTrigger>
                                        <TabsTrigger value="javascript" className="text-xs h-7 data-[state=active]:bg-background/80" onClick={() => setSelectedExample(prev => ({ ...prev, [`${r.id}-${e.method}`]: 'javascript' }))}>
                                          JS
                                        </TabsTrigger>
                                        <TabsTrigger value="python" className="text-xs h-7 data-[state=active]:bg-background/80" onClick={() => setSelectedExample(prev => ({ ...prev, [`${r.id}-${e.method}`]: 'python' }))}>
                                          Python
                                        </TabsTrigger>
                                      </TabsList>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => copyToClipboard(codeExample, `code-${endpointKey}`)}
                                      >
                                        {copiedKey === `code-${endpointKey}` ? (
                                          <Check className="h-3.5 w-3.5 text-green-600" />
                                        ) : (
                                          <Copy className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>

                                    <div className="relative">
                                      {/* Window Controls Decoration */}
                                      <div className="absolute top-0 left-0 right-0 h-6 bg-muted/80 backdrop-blur border-b border-border/50 flex items-center px-2 gap-1.5 z-10 rounded-t-md">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30"></div>
                                      </div>

                                      {['curl', 'javascript', 'python'].map((lang) => (
                                        <TabsContent key={lang} value={lang} className="mt-0">
                                          <div className="border border-border/50 rounded-md overflow-hidden pt-6 bg-[#282c34] shadow-inner">
                                            <CodeMirror
                                              value={codeExample}
                                              height="auto"
                                              minHeight="100px"
                                              extensions={[]}
                                              theme={oneDark} // Force dark theme for code blocks for better contrast
                                              editable={false}
                                              basicSetup={{
                                                lineNumbers: false,
                                                foldGutter: false,
                                              }}
                                              className="text-xs"
                                            />
                                          </div>
                                        </TabsContent>
                                      ))}
                                    </div>
                                  </Tabs>
                                </div>

                                {/* Response Section */}
                                {example != null && (e.method === 'GET' || e.method === 'POST' || e.method === 'PUT') && (
                                  <div className="space-y-2">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response (200 OK)</div>

                                    <div className="relative mt-[42px]"> {/* Align with code block content start (tabs + window header height approx) -> actually let's just make it visually consistent */}
                                      <div className="absolute top-0 left-0 right-0 h-6 bg-muted/80 backdrop-blur border-b border-border/50 flex items-center px-2 justify-between z-10 rounded-t-md">
                                        <span className="text-[10px] uppercase font-mono text-muted-foreground ml-1">JSON</span>
                                        <Button size="sm" variant="ghost" className="h-4 w-4 p-0" title="Copy">
                                          <Copy className="h-2.5 w-2.5" />
                                        </Button>
                                      </div>
                                      <div className="border border-border/50 rounded-md overflow-hidden pt-6 bg-[#282c34] shadow-inner h-full">
                                        <CodeMirror
                                          value={JSON.stringify(example as Record<string, unknown>, null, 2)}
                                          height="auto"
                                          minHeight="100px"
                                          extensions={[json()]}
                                          theme={oneDark}
                                          editable={false}
                                          basicSetup={{
                                            lineNumbers: false,
                                            foldGutter: true,
                                          }}
                                          className="text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}


