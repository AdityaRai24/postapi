"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Plus, Settings, FolderOpen, Rocket } from "lucide-react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

type Project = {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  deployedLink?: string;
  userId: string;
  status: "DRAFT" | "DEPLOYED" | "ARCHIVED";
  endpoints: any[]; // Define a proper Endpoint type if needed
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    fetchProjects();
  }, [user?.id]);

  async function fetchProjects() {
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
  }

  async function createProject() {
    if (!name.trim() || !slug.trim() || !user?.id) return;

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

  const openDeployModal = (project: Project) => {
    setSelectedProject(project);
    setDeployModalOpen(true);
  };

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
                  onChange={(e) => setSlug(e.target.value)}
                />
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
                disabled={!name.trim() || !slug.trim()}
              >
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Loading projects...</CardTitle>
              <CardDescription>
                Please wait while we fetch your projects.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>
                Click "Create Project" to start a new project.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          projects.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>
                  {p.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link href={`/dashboard/${p.id}`}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Open Project
                    </Link>
                  </Button>
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
    </main>
  );
}
