"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Plus,
  FolderOpen,
  Rocket,
  Calendar,
  Globe,
  Trash2,
  MoreVertical,
  Search,
  BarChart3,
  Box,
  Layers,
  ArrowRight
} from "lucide-react";
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
import { motion } from "framer-motion";
import { DeployModal, type Project } from "@/components/deploy-modal";


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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search projects..."]') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.slug?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Calculate stats
  const totalProjects = projects.length;
  const deployedProjects = projects.filter(p => p.status === 'DEPLOYED').length;
  const totalEndpoints = projects.reduce((sum, p) => sum + (p.endpoints?.length || 0), 0);

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
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 opacity-20 blur-[100px]"></div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage your APIs and keys from one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search projects... (Cmd+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create a new project</DialogTitle>
                  <CardDescription>
                    Start building a new API collection.
                  </CardDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
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
                <DialogFooter className="mt-4">
                  <Button
                    onClick={createProject}
                    disabled={!name.trim() || !slug.trim() || isCreating}
                    className="w-full sm:w-auto"
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
        </div>

        {/* Stats Cards */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Box className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active workspaces
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Deployed APIs</CardTitle>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Rocket className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{deployedProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalProjects > 0 ? Math.round((deployedProjects / totalProjects) * 100) : 0}% deployment rate
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Endpoints</CardTitle>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Layers className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalEndpoints}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all projects
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Results Info */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2">
            <Search className="h-4 w-4" />
            <span>
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              {filteredProjects.length !== projects.length && ` (filtered from ${projects.length})`}
            </span>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card/50 border-muted-foreground/10">
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
          ) : filteredProjects.length === 0 ? (
            <Card className="col-span-full border-dashed bg-muted/20 border-muted-foreground/20">
              <CardHeader className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  {searchQuery ? (
                    <Search className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <FolderOpen className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-xl">
                  {searchQuery ? "No projects found" : "No projects yet"}
                </CardTitle>
                <CardDescription className="mt-2 max-w-md mx-auto text-base">
                  {searchQuery
                    ? `No projects match "${searchQuery}". Try a different search term.`
                    : "Get started by creating your first API project. It only takes a few minutes!"
                  }
                </CardDescription>
                {!searchQuery && (
                  <Button className="mt-8 w-fit mx-auto" onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first project
                  </Button>
                )}
              </CardHeader>
            </Card>
          ) : (
            filteredProjects.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm border-muted-foreground/10">
                  <CardHeader className="space-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          {p.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">
                          {p.description || "No description provided."}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
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

                    <div className="flex flex-wrap gap-2 pt-2">
                      {p.status && (
                        <Badge
                          variant="outline"
                          className={`${p.status === 'DEPLOYED'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                            }`}
                        >
                          {p.status === 'DEPLOYED' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />}
                          {p.status}
                        </Badge>
                      )}
                      {p.slug && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 text-xs text-muted-foreground border border-muted-foreground/10">
                          <Globe className="h-3 w-3" />
                          <code className="font-mono">{p.slug}</code>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                      <Link href={`/dashboard/${p.id}`}>
                        Open Project
                        <ArrowRight className="h-4 w-4 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </section>

        {/* Deploy Modal */}
        <DeployModal
          open={deployModalOpen}
          onOpenChange={setDeployModalOpen}
          project={selectedProject}
          onDeploy={(project) => deployProject(project)}
          isDeploying={isDeploying}
        />

        {/* Delete Project Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                {projectToDelete ? <span className="font-semibold text-foreground"> "{projectToDelete.name}"</span> : ""} and all its resources, endpoints, and data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {projectToDelete && (
              <div className="rounded-lg border p-4 bg-muted/50 border-destructive/20">
                <div className="font-medium text-foreground">{projectToDelete.name}</div>
                {projectToDelete.description && (
                  <div className="mt-1 text-sm text-muted-foreground">{projectToDelete.description}</div>
                )}
                {projectToDelete.slug && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {projectToDelete.slug}
                    </Badge>
                  </div>
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
    </>
  );
}
