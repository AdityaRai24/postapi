"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { Plus, FolderOpen, Rocket, Calendar, Globe, Trash2, MoreVertical } from "lucide-react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Project = {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  deployedLink?: string;
  userId: string;
  status: "DRAFT" | "DEPLOYED" | "ARCHIVED";
  endpoints: unknown[]; // Define a proper Endpoint type if needed
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useUser();

  const fetchProjects = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: {
          "User-Id": user.id,
        },
      });
      setProjects(response.data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function createProject() {
    if (!name.trim() || !slug.trim() || !user?.id) return;

    setIsCreating(true);
    try {
      const projectData = {
        name: name.trim(),
        description: description.trim(),
        slug: slug.trim(),
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/projects`,
        projectData,
        {
          headers: {
            "Content-Type": "application/json",
            "User-Id": user.id,
          },
        }
      );

      const newProject: Project = response.data;

      setOpen(false);
      setName("");
      setDescription("");
      setSlug("");
      toast.success(`Project "${newProject.name}" created successfully!`);

      // Refresh the projects list
      fetchProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function deployProject(project: Project) {
    if (!user?.id) return;

    setIsDeploying(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/projects/${project.id}/deploy`,
        {},
        {
          headers: {
            "User-Id": user.id,
          },
        }
      );

      toast.success(`Project "${project.name}" deployed successfully!`);
      setDeployModalOpen(false);
      setSelectedProject(null);
      
      // Refresh the projects list to get updated deployment status
      fetchProjects();
    } catch (error) {
      console.error("Failed to deploy project:", error);
      toast.error("Failed to deploy project. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  }

  async function deleteProject() {
    if (!projectToDelete || !user?.id) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/projects/${projectToDelete.id}`, {
        headers: {
          "User-Id": user.id,
        },
      });

      toast.success(`Project "${projectToDelete.name}" deleted successfully!`);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      
      // Refresh the projects list
      fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }


  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your APIs and keys.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g. E-commerce API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-slug">Project Slug (unique)</Label>
                <Input
                  id="project-slug"
                  placeholder="e.g. ecommerce-api"
                  value={slug}
                  onChange={(e) => {
                    // Auto-format: lowercase, replace spaces with hyphens, remove special chars
                    const formatted = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "");
                    setSlug(formatted);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe what this project will do..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={createProject}
                disabled={!name.trim() || !slug.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Rocket className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : projects.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardHeader className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription className="mt-2">
                Get started by creating your first API project. It only takes a few minutes!
              </CardDescription>
              <Button className="mt-6" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            </CardHeader>
          </Card>
        ) : (
          projects.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {p.description || "No description"}
                    </CardDescription>
                  </div>
                  {p.status && (
                    <Badge 
                      variant={p.status === 'DEPLOYED' ? 'default' : 'secondary'}
                      className="ml-2 shrink-0"
                    >
                      {p.status}
                    </Badge>
                  )}
                </div>
                {p.slug && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <code className="font-mono">{p.slug}</code>
                  </div>
                )}
                {p.createdAt && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/dashboard/${p.id}`}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Open Project
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setProjectToDelete(p);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {/* Deploy Modal */}
      <Dialog open={deployModalOpen} onOpenChange={setDeployModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedProject?.status === 'DEPLOYED' ? 'Deployment Information' : 'Deploy Project'}
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              {selectedProject.status === 'DEPLOYED' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      Project is currently deployed and live
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Project Information</Label>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div>
                    <span className="font-medium">Name: </span>
                    <span>{selectedProject.name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Description: </span>
                    <span>{selectedProject.description || "No description"}</span>
                  </div>
                  <div>
                    <span className="font-medium">Status: </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedProject.status === 'DEPLOYED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedProject.status}
                    </span>
                    {selectedProject.status === 'DEPLOYED' && (
                      <span className="ml-2 text-xs text-green-600">
                        ✓ Live and accessible
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deployed-url">
                  {selectedProject.status === 'DEPLOYED' ? 'Current Deployed URL' : 'Deployed URL'}
                </Label>
                <Input
                  id="deployed-url"
                  value={selectedProject.deployedLink || `${API_BASE_URL}/api/${selectedProject.slug || 'project-slug'}`}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedProject.status === 'DEPLOYED' 
                    ? 'This URL is currently live and accessible'
                    : 'This URL will be available after deployment'
                  }
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedProject?.status === 'DEPLOYED' ? (
              <>
                {selectedProject?.slug && (
                  <Button asChild variant="secondary">
                    <Link href={`/docs/${selectedProject.slug}`}>View Docs</Link>
                  </Button>
                )}
                <Button onClick={() => setDeployModalOpen(false)}>Close</Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDeployModalOpen(false)}
                  disabled={isDeploying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedProject && deployProject(selectedProject)}
                  disabled={isDeploying}
                >
                  {isDeploying ? (
                    <>
                      <Rocket className="h-4 w-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Deploy Project
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              {projectToDelete ? ` "${projectToDelete.name}"` : ""} and all its resources, endpoints, and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {projectToDelete && (
            <div className="rounded-md border p-3 bg-muted">
              <div className="font-medium">{projectToDelete.name}</div>
              {projectToDelete.description && (
                <div className="mt-1 text-sm text-muted-foreground">{projectToDelete.description}</div>
              )}
              {projectToDelete.slug && (
                <div className="mt-1 font-mono text-xs text-muted-foreground">{projectToDelete.slug}</div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
