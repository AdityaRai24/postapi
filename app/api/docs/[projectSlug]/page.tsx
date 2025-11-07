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
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-semibold tracking-tight">API Documentation</h1>
            </div>
            <div className="flex items-center gap-2 ml-11">
              <p className="text-lg font-medium">{project.name}</p>
              {project.description && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">{project.description}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ExternalLink className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button
              onClick={() => copyToClipboard(baseApiUrl, "base")}
              variant="secondary"
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

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Base URL
          </CardTitle>
          <CardDescription>The root URL for all endpoints in this project. Use this as the prefix for all API calls.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border bg-background p-4 font-mono text-sm">
            <code className="flex-1 break-all">{baseApiUrl}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(baseApiUrl, "inline-base")}
              className="ml-2 shrink-0"
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

      <Separator />

      {resources.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>No resources found</CardTitle>
            <CardDescription className="mt-2">
              This project has no resources yet. Create resources in your dashboard to see them here.
            </CardDescription>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Resources</h2>
            <Badge variant="secondary">{resources.length} resource{resources.length !== 1 ? 's' : ''}</Badge>
          </div>
          
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
              <Card key={r.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleResource(r.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="text-xl">{r.name}</span>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                      {r.description && (
                        <CardDescription className="mt-2">{r.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
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
                  <CardContent className="space-y-6 pt-0">
                    {endpoints.map((e, idx) => {
                      const endpointKey = `${r.id}-${e.method}-${idx}`;
                      const codeExample = generateCodeExample(e.method, e.path, r, example);
                      
                      return (
                        <div key={idx} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <Badge className={methodColor[e.method] || "bg-muted"}>
                                  {e.method}
                                </Badge>
                                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                  {e.path}
                                </code>
                              </div>
                              <p className="text-sm text-muted-foreground">{e.summary}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(`${baseApiUrl}${e.path}`, `ep-${endpointKey}`)}
                            >
                              {copiedKey === `ep-${endpointKey}` ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <Tabs defaultValue="curl" className="w-full">
                            <div className="flex items-center justify-between mb-2">
                              <TabsList>
                                <TabsTrigger value="curl" onClick={() => setSelectedExample(prev => ({ ...prev, [`${r.id}-${e.method}`]: 'curl' }))}>
                                  <Terminal className="h-3 w-3 mr-1" />
                                  cURL
                                </TabsTrigger>
                                <TabsTrigger value="javascript" onClick={() => setSelectedExample(prev => ({ ...prev, [`${r.id}-${e.method}`]: 'javascript' }))}>
                                  <Code2 className="h-3 w-3 mr-1" />
                                  JavaScript
                                </TabsTrigger>
                                <TabsTrigger value="python" onClick={() => setSelectedExample(prev => ({ ...prev, [`${r.id}-${e.method}`]: 'python' }))}>
                                  <Code2 className="h-3 w-3 mr-1" />
                                  Python
                                </TabsTrigger>
                              </TabsList>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(codeExample, `code-${endpointKey}`)}
                              >
                                {copiedKey === `code-${endpointKey}` ? (
                                  <Check className="h-4 w-4 text-green-600 mr-1" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-1" />
                                )}
                                Copy
                              </Button>
                            </div>
                            
                            <TabsContent value="curl" className="mt-0">
                              <div className="border rounded-md overflow-hidden">
                                <CodeMirror
                                  value={codeExample}
                                  height="auto"
                                  minHeight="100px"
                                  extensions={[]}
                                  theme={isDarkMode ? oneDark : undefined}
                                  editable={false}
                                  basicSetup={{
                                    lineNumbers: true,
                                  }}
                                  className="text-sm"
                                />
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="javascript" className="mt-0">
                              <div className="border rounded-md overflow-hidden">
                                <CodeMirror
                                  value={codeExample}
                                  height="auto"
                                  minHeight="100px"
                                  extensions={[]}
                                  theme={isDarkMode ? oneDark : undefined}
                                  editable={false}
                                  basicSetup={{
                                    lineNumbers: true,
                                  }}
                                  className="text-sm"
                                />
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="python" className="mt-0">
                              <div className="border rounded-md overflow-hidden">
                                <CodeMirror
                                  value={codeExample}
                                  height="auto"
                                  minHeight="100px"
                                  extensions={[]}
                                  theme={isDarkMode ? oneDark : undefined}
                                  editable={false}
                                  basicSetup={{
                                    lineNumbers: true,
                                  }}
                                  className="text-sm"
                                />
                              </div>
                            </TabsContent>
                          </Tabs>

                          {example != null && (e.method === 'GET' || e.method === 'POST' || e.method === 'PUT') && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Example Response</div>
                              <div className="border rounded-md overflow-hidden">
                                <CodeMirror
                                  value={JSON.stringify(example as Record<string, unknown>, null, 2)}
                                  height="auto"
                                  minHeight="150px"
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </section>
      )}
    </main>
  );
}


