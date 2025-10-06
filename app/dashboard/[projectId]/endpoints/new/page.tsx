"use client";

import {useState,useEffect} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Save, ArrowLeft, Wand2, Settings } from "lucide-react";

// --- TYPES TO MATCH YOUR SPRING BOOT MODELS ---
type EndPoint = {
  name: string;
  description?: string;
  slug: string;
  method: string;
  mockData?: unknown;
  responseJson?: unknown;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
  deployedLink?: string;
  userId: string;
  status: "DRAFT" | "DEPLOYED" | "ARCHIVED";
  endpoints: EndPoint[];
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function NewEndpointPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const { user } = useUser();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [endpointName, setEndpointName] = useState("");
  const [endpointDescription, setEndpointDescription] = useState("");
  const [baseSlug, setBaseSlug] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<{[key: string]: boolean}>({
    GET: false,
    POST: false,
    GET_BY_ID: false,
    PUT: false,
    DELETE: false,
  });
  const [methodDescriptions, setMethodDescriptions] = useState<{[key: string]: string}>({
    GET: "",
    POST: "",
    GET_BY_ID: "",
    PUT: "",
    DELETE: "",
  });
  const [jsonSchema, setJsonSchema] = useState(
    '{\n  "id": 1,\n  "name": "Sample Product",\n  "price": 99.99,\n  "description": "A sample product"\n}'
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethodForModal, setSelectedMethodForModal] = useState<string | null>(null);
  // --- DATA FETCHING: Replaced localStorage with an API call ---
  useEffect(() => {
    if (!projectId || !user?.id) return;
    async function fetchProject() {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/projects/${projectId}`,
          {
            headers: { "User-Id": user?.id }, // Assuming you'll add security later
          }
        );
        console.log("hello")
        setProject(response.data);
      } catch (error) {
        console.error("Failed to load project:", error);
        toast.error("Could not find the specified project.");
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [projectId, user?.id]);

  // Auto-generate slug from endpoint name
  useEffect(() => {
    if (endpointName) {
      setBaseSlug(
        endpointName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
      );
    }
  }, [endpointName]);

  // Auto-generate method descriptions based on endpoint name
  useEffect(() => {
    if (endpointName) {
      const singular = endpointName.endsWith('s') ? endpointName.slice(0, -1) : endpointName;
      const plural = endpointName.endsWith('s') ? endpointName : endpointName + 's';
      
      setMethodDescriptions({
        GET: `Get all ${plural}`,
        POST: `Add a new ${singular}`,
        GET_BY_ID: `Get a particular ${singular}`,
        PUT: `Edit ${singular}`,
        DELETE: `Delete ${singular}`,
      });
    }
  }, [endpointName]);

  // Helper functions
  const methodConfigs = [
    { key: "GET", label: "GET", route: `/${baseSlug}`, method: "GET" },
    { key: "POST", label: "POST", route: `/${baseSlug}`, method: "POST" },
    { key: "GET_BY_ID", label: "GET", route: `/${baseSlug}/{id}`, method: "GET_BY_ID" },
    { key: "PUT", label: "PUT", route: `/${baseSlug}/{id}`, method: "PUT" },
    { key: "DELETE", label: "DELETE", route: `/${baseSlug}/{id}`, method: "DELETE" },
  ];

  const generateMockData = () => {
    const sampleData = {
      id: 1,
      name: `Sample ${endpointName || 'Item'}`,
      description: `A sample ${endpointName?.toLowerCase() || 'item'}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJsonSchema(JSON.stringify(sampleData, null, 2));
  };

  const openMethodModal = (methodKey: string) => {
    setSelectedMethodForModal(methodKey);
    setIsModalOpen(true);
  };

  // --- DATA SAVING: Create single resource with enabled methods ---
  async function saveResource() {
    if (!endpointName.trim() || !baseSlug.trim() || !user?.id) return;

    const selectedMethodKeys = Object.keys(selectedMethods).filter(key => selectedMethods[key]);
    if (selectedMethodKeys.length === 0) {
      toast.error("Please select at least one method.");
      return;
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonSchema);
      setJsonError(null);
    } catch (e) {
      setJsonError("Invalid JSON. Please fix and try again.");
      return;
    }

    setIsSaving(true);
    try {
      // Create single resource with enabled methods
      const payload = {
        projectId: projectId,
        name: endpointName.trim(),
        description: endpointDescription.trim(),
        slug: baseSlug.trim(),
        mockData: parsedJson,
        enabledMethods: selectedMethodKeys.map(methodKey => {
          const config = methodConfigs.find(c => c.key === methodKey);
          return config?.method || methodKey;
        }),
      };

      await axios.post(
        `${API_BASE_URL}/api/projects/${projectId}/resources`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "User-Id": user.id,
          },
        }
      );

      toast.success(`Resource "${endpointName}" created successfully with ${selectedMethodKeys.length} method(s)!`);
      setTimeout(() => router.push(`/dashboard/${projectId}`), 1000);
    } catch (error) {
      console.error("Failed to save resource:", error);
      toast.error("Failed to save the resource. Please try again.");
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p>Loading project...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-muted-foreground">Project not found.</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Create Resource
        </h1>
        <p className="text-muted-foreground">Project: {project.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Resource Details */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Details</CardTitle>
            <CardDescription>Configure your API resource</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpointName">Resource Name</Label>
              <Input
                id="endpointName"
                placeholder="e.g. products"
                value={endpointName}
                onChange={(e) => setEndpointName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Base URL: <code className="bg-muted px-1 py-0.5 rounded">/{baseSlug}</code>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpointDescription">Description</Label>
              <Textarea
                id="endpointDescription"
                placeholder="Describe what this endpoint group manages..."
                value={endpointDescription}
                onChange={(e) => setEndpointDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Middle panel - Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Methods</CardTitle>
            <CardDescription>Choose which routes you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {methodConfigs.map((config) => (
              <div key={config.key} className="space-y-2">
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethods[config.key] 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => 
                    setSelectedMethods(prev => ({ ...prev, [config.key]: !prev[config.key] }))
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-1 bg-muted rounded">{config.label}</span>
                      <code className="text-xs text-muted-foreground">{config.route}</code>
                    </div>
                    {selectedMethods[config.key] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMethodModal(config.key);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right panel - Schema & Mock Data */}
        <Card>
          <CardHeader>
            <CardTitle>Data Schema</CardTitle>
            <CardDescription>Paste your JSON data or generate sample data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={generateMockData}>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate AI Data
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="json-data">JSON Data (Ctrl+V to paste)</Label>
                <Textarea
                  id="json-data"
                  rows={20}
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  placeholder="Paste your JSON data here or use the Generate AI Data button..."
                  className="font-mono text-sm"
                />
                {jsonError && (
                  <p className="text-sm text-destructive mt-2">{jsonError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={saveResource}
          disabled={isSaving || !endpointName.trim() || !baseSlug.trim() || Object.values(selectedMethods).every(v => !v)}
          size="lg"
        >
          {isSaving ? (
            "Creating Resource..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> 
              Create Resource with {Object.values(selectedMethods).filter(Boolean).length} Method(s)
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
          size="lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Method Settings Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Method Settings</DialogTitle>
            <DialogDescription>
              Configure details for {selectedMethodForModal && methodConfigs.find(c => c.key === selectedMethodForModal)?.label} method
            </DialogDescription>
          </DialogHeader>
          {selectedMethodForModal && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="method-description">Description</Label>
                <Textarea
                  id="method-description"
                  placeholder={methodDescriptions[selectedMethodForModal]}
                  value={methodDescriptions[selectedMethodForModal]}
                  onChange={(e) => 
                    setMethodDescriptions(prev => ({ ...prev, [selectedMethodForModal]: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Route Information</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-1 bg-background rounded">
                      {methodConfigs.find(c => c.key === selectedMethodForModal)?.label}
                    </span>
                    <code className="text-xs text-muted-foreground">
                      {methodConfigs.find(c => c.key === selectedMethodForModal)?.route}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
