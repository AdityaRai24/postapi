"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { Plus, Trash2, Copy, Edit, Rocket, BookText, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

type Project = {
  id: string;
  name: string;
  slug?: string;
  createdAt: string;
  apiBaseUrl: string;
  description?: string;
  status?: "DRAFT" | "DEPLOYED" | "ARCHIVED";
  deployedLink?: string;
};

type Resource = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  slug: string;
  mockData: unknown;
  enabledMethods: string[];
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        
        // Get project first
        const projectRes = await axios.get<Project>(`${API_BASE_URL}/api/projects/${projectId}`);
        if (!cancelled) {
          setProject(projectRes.data ?? null);
        }
        
        // Get resources
        const resourcesRes = await axios.get<Resource[]>(`${API_BASE_URL}/api/projects/${projectId}/resources`);
        if (!cancelled) {
          setResources(Array.isArray(resourcesRes.data) ? resourcesRes.data : []);
        }
      } catch (e) {
        console.error("Failed to load project/resources from API:", e);
        if (!cancelled) {
          setProject(null);
          setResources([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);


  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Project not found</CardTitle>
            <CardDescription>
              The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">Manage endpoints for this project.</p>
        </div>
        <div className="flex items-center gap-2">
          {project.slug && (
            <>
              <Button asChild variant="outline" disabled={resources.length === 0}>
                <Link href={`/api/docs/${project.slug}`}>
                  <BookText className="h-4 w-4 mr-2" />
                  Documentation
                </Link>
              </Button>
            </>
          )}
          <Button asChild>
            <Link href={`/dashboard/${project.id}/endpoints/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Resource
            </Link>
          </Button>
          {project.status !== 'DEPLOYED' && resources.length > 0 && (
            <Button
              variant="default"
              onClick={() => setShowDeployDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          )}
        </div>
      </div>

      {resources.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Deploy and Documentation will be enabled after you create at least one resource.
        </p>
      )}

      <Separator />

      {resources.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No resources yet</CardTitle>
            <CardDescription className="mt-2">
              Create your first resource to start building your API endpoints.
            </CardDescription>
            <Button asChild className="mt-6">
              <Link href={`/dashboard/${project.id}/endpoints/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first resource
              </Link>
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => {
            const baseUrl = `${API_BASE_URL}/api/${project.slug || 'project-slug'}/${resource.slug}`;
            const methodColors: {[key: string]: string} = {
              'GET': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
              'POST': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
              'PUT': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
              'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
              'PATCH': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            };
            
            return (
              <Card key={resource.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{resource.name}</h3>
                      <code className="text-sm font-mono text-muted-foreground">/{resource.slug}</code>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(baseUrl);
                      toast.success("Copied to clipboard");
                      const key = `base-${resource.id}`;
                      setCopiedKey(key);
                      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
                    }}>
                      {copiedKey === `base-${resource.id}` ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </CardTitle>
                  {resource.description && (
                    <CardDescription>{resource.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {resource.enabledMethods.map((method, index) => {
                        const displayMethod = method === 'GET_BY_ID' ? 'GET' : method;
                        const route = method === 'GET_BY_ID' ? `/${resource.slug}/{id}` : 
                                     method === 'GET' ? `/${resource.slug}` :
                                     (method === 'PUT' || method === 'DELETE') ? `/${resource.slug}/{id}` : 
                                     `/${resource.slug}`;
                        const fullUrl = `${API_BASE_URL}/api/${project.slug || 'project-slug'}${route}`;
                        
                        return (
                          <div key={`${method}-${index}`} className="flex items-center gap-1">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${methodColors[displayMethod] || 'bg-muted'}`}>
                              {displayMethod}
                            </span>
                            <code className="text-xs text-muted-foreground">{route}</code>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(fullUrl);
                                toast.success("Copied to clipboard");
                                const key = `ep-${resource.id}-${index}`;
                                setCopiedKey(key);
                                setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
                              }}
                            >
                              {copiedKey === `ep-${resource.id}-${index}` ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/${project.id}/endpoints/${resource.id}`}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setResourceToDelete(resource); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the resource
              {resourceToDelete ? ` "${resourceToDelete.name}"` : ""} and its configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {resourceToDelete && (
              <div className="rounded-md border p-3">
                <div className="font-mono text-xs text-muted-foreground">/{resourceToDelete.slug}</div>
                {resourceToDelete.description && (
                  <div className="mt-1 text-muted-foreground">{resourceToDelete.description}</div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!resourceToDelete) return;
                  try {
                    setIsDeleting(true);
                    await axios.delete(`${API_BASE_URL}/api/resources/${resourceToDelete.id}`, {
                      headers: { "User-Id": user?.id || "" },
                    });
                    toast.success("Resource deleted successfully!");
                    setResources(prev => prev.filter(r => r.id !== resourceToDelete.id));
                    setDeleteDialogOpen(false);
                    setResourceToDelete(null);
                  } catch (error) {
                    console.error("Failed to delete resource:", error);
                    toast.error("Failed to delete the resource. Please try again.");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Deploy Dialog */}
      {showDeployDialog && (
        <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Deploy Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to deploy this project? It will become live and API endpoints will be accessible via the deployed URL.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div>
                <span className="font-medium">Name:</span> {project.name}
              </div>
              <div>
                <span className="font-medium">Deploy URL:</span> <code>{API_BASE_URL}/api/{project.slug}</code>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowDeployDialog(false)} disabled={isDeploying}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={async () => {
                  setIsDeploying(true);
                  try {
                    await axios.put(`${API_BASE_URL}/api/projects/${project.id}/deploy`, {}, {
                      headers: { 'User-Id': user?.id || '' }
                    });
                    toast.success('Project deployed successfully!');
                    setProject((prev) => prev ? { ...prev, status: 'DEPLOYED' } : prev);
                    setShowDeployDialog(false);
                  } catch {
                    toast.error('Failed to deploy project.');
                  } finally {
                    setIsDeploying(false);
                  }
                }}
                disabled={isDeploying}
              >
                {isDeploying ? (
                  <><Rocket className="h-4 w-4 mr-2 animate-spin" /> Deploying...</>
                ) : (
                  <><Rocket className="h-4 w-4 mr-2" /> Deploy Project</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}


