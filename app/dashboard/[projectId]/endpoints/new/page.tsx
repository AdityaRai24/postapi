"use client";

import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ArrowLeft, Settings, Copy, Check, Home, Sparkles } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { faker } from '@faker-js/faker';

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
  const [selectedMethods, setSelectedMethods] = useState<{ [key: string]: boolean }>({
    GET: false,
    POST: false,
    GET_BY_ID: false,
    PUT: false,
    DELETE: false,
  });
  const [methodDescriptions, setMethodDescriptions] = useState<{ [key: string]: string }>({
    GET: "",
    POST: "",
    GET_BY_ID: "",
    PUT: "",
    DELETE: "",
  });
  const [jsonSchema, setJsonSchema] = useState(
    '[\n  {\n    "id": 1,\n    "name": "Sample Product",\n    "price": 99.99,\n    "description": "A sample product"\n  },\n  {\n    "id": 2,\n    "name": "Another Product",\n    "price": 49.0,\n    "description": "Another sample"\n  }\n]'
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);
  const [primaryKeyOptions, setPrimaryKeyOptions] = useState<string[]>([]);
  const [isPrimaryKeyModalOpen, setIsPrimaryKeyModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethodForModal, setSelectedMethodForModal] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<string>("custom");
  const [itemCount, setItemCount] = useState(5);
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

  // Schema templates for faker.js
  const schemaTemplates: Record<string, () => Record<string, unknown>> = {
    user: () => ({
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      avatar: faker.image.avatar(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }),
    product: () => ({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      category: faker.commerce.department(),
      image: faker.image.urlLoremFlickr({ category: 'business' }),
      inStock: faker.datatype.boolean(),
      rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 }).toFixed(1)),
      reviews: faker.number.int({ min: 0, max: 1000 }),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }),
    order: () => ({
      id: faker.string.uuid(),
      orderNumber: faker.string.alphanumeric(10).toUpperCase(),
      customerId: faker.string.uuid(),
      customerName: faker.person.fullName(),
      items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        productId: faker.string.uuid(),
        productName: faker.commerce.productName(),
        quantity: faker.number.int({ min: 1, max: 10 }),
        price: parseFloat(faker.commerce.price()),
      })),
      total: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      shippingAddress: faker.location.streetAddress(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }),
    blog: () => ({
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      slug: faker.lorem.slug(),
      content: faker.lorem.paragraphs(3),
      excerpt: faker.lorem.sentence(),
      author: faker.person.fullName(),
      authorEmail: faker.internet.email(),
      category: faker.helpers.arrayElement(['Technology', 'Business', 'Lifestyle', 'Travel', 'Food']),
      tags: faker.helpers.arrayElements(['web', 'design', 'development', 'tutorial', 'tips'], { min: 2, max: 4 }),
      image: faker.image.urlLoremFlickr({ category: 'nature' }),
      views: faker.number.int({ min: 0, max: 10000 }),
      published: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }),
    comment: () => ({
      id: faker.string.uuid(),
      postId: faker.string.uuid(),
      author: faker.person.fullName(),
      authorEmail: faker.internet.email(),
      content: faker.lorem.paragraph(),
      avatar: faker.image.avatar(),
      likes: faker.number.int({ min: 0, max: 100 }),
      replies: faker.number.int({ min: 0, max: 10 }),
      approved: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }),
    custom: () => {
      // Generate based on endpoint name if available
      return {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
      };
    },
  };

  const generateMockData = () => {
    setIsGeneratorOpen(true);
  };

  const handleGenerateData = () => {
    const generator = schemaTemplates[selectedSchema] || schemaTemplates.custom;
    const generatedData = Array.from({ length: itemCount }, () => generator());
    setJsonSchema(JSON.stringify(generatedData, null, 2));
    setJsonError(null);
    setIsGeneratorOpen(false);
    toast.success(`Generated ${itemCount} ${selectedSchema} item(s)!`);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonSchema);
    setCopied(true);
    toast.success("JSON copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonSchema);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonSchema(formatted);
      // Re-validate after formatting
      const error = validateJson(formatted);
      setJsonError(error);
      if (!error) {
        toast.success("JSON formatted successfully!");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Invalid JSON syntax";
      setJsonError(`Cannot format: ${errorMsg}`);
      toast.error("Invalid JSON. Please fix errors first.");
    }
  };

  const validateJson = (value: string): string | null => {
    if (!value.trim()) {
      return "JSON data is required";
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(value);
    } catch (error) {
      if (error instanceof Error) {
        return `Invalid JSON: ${error.message}`;
      }
      return "Invalid JSON syntax. Please check your brackets, commas, and quotes.";
    }

    // Require an array of objects
    if (!Array.isArray(parsedJson)) {
      return "JSON must be an array of objects";
    }

    if (parsedJson.length === 0) {
      return "Array must contain at least one object";
    }

    if (typeof parsedJson[0] !== 'object' || parsedJson[0] === null) {
      return "Array must contain objects, not primitives";
    }

    return null; // Valid JSON
  };

  const handleJsonChange = (value: string) => {
    setJsonSchema(value);
    // Validate in real-time
    const error = validateJson(value);
    setJsonError(error);
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

    // Validate JSON before proceeding
    const error = validateJson(jsonSchema);
    if (error) {
      setJsonError(error);
      toast.error("Please fix JSON errors before creating the resource.");
      return;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonSchema);
    } catch {
      setJsonError("Invalid JSON. Please fix and try again.");
      toast.error("Invalid JSON. Please fix errors before creating the resource.");
      return;
    }

    // If primary key not chosen, open modal with keys from first object
    if (Array.isArray(parsedJson) && parsedJson.length > 0 && typeof parsedJson[0] === 'object' && parsedJson[0] !== null) {
      const firstKeys = Object.keys(parsedJson[0] as Record<string, unknown>);
      if (!primaryKey) {
        setPrimaryKeyOptions(firstKeys);
        setIsPrimaryKeyModalOpen(true);
        return;
      }
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
        primaryKey,
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

  async function confirmPrimaryKeyAndSave() {
    if (!primaryKey) return;
    await saveResource();
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
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

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
            <BreadcrumbPage>Create Resource</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 -mx-4 rounded-b-lg border-b border-border/40">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight gradient-text">
            Create Resource
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define your data model and endpoints for <span className="font-semibold text-foreground">{project.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSaving}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={saveResource}
            disabled={
              isSaving ||
              !endpointName.trim() ||
              !baseSlug.trim() ||
              Object.values(selectedMethods).every(v => !v) ||
              !!jsonError ||
              !jsonSchema.trim()
            }
            size="sm"
            className={isSaving ? "opacity-80" : "shadow-lg shadow-primary/20"}
          >
            {isSaving ? (
              <>
                <Sparkles className="h-3 w-3 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Resource
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Resource Details */}
        <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 h-fit">
          <CardHeader>
            <CardTitle>Resource Details</CardTitle>
            <CardDescription>Configure your API resource</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpointName">Resource Name</Label>
              <Input
                id="endpointName"
                placeholder="Product, Order, User..."
                value={endpointName}
                onChange={(e) => setEndpointName(e.target.value)}
                className="bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all font-medium"
              />
              <div className="mt-2 p-2 bg-muted/50 rounded-md border border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-mono overflow-x-auto">
                <span className="shrink-0 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                  Base URL:
                </span>
                <span className="text-foreground font-semibold">/{baseSlug || '...'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpointDescription">Description</Label>
              <Textarea
                id="endpointDescription"
                placeholder="Describe what this endpoint group manages..."
                value={endpointDescription}
                className="!max-h-[400px] bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all resize-none"
                onChange={(e) => setEndpointDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Middle panel - Method Selection */}
        <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 h-fit">
          <CardHeader>
            <CardTitle>Select Methods</CardTitle>
            <CardDescription>Choose which routes you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {methodConfigs.map((config) => {
              const isSelected = selectedMethods[config.key];
              // Define colors per method
              const colors: Record<string, string> = {
                GET: "text-green-600 dark:text-green-400 bg-green-500/5 border-green-500/20 hover:border-green-500/50",
                POST: "text-blue-600 dark:text-blue-400 bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50",
                GET_BY_ID: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50",
                PUT: "text-orange-600 dark:text-orange-400 bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50",
                DELETE: "text-red-600 dark:text-red-400 bg-red-500/5 border-red-500/20 hover:border-red-500/50",
              };
              const activeColors: Record<string, string> = {
                GET: "bg-green-500/10 border-green-500",
                POST: "bg-blue-500/10 border-blue-500",
                GET_BY_ID: "bg-emerald-500/10 border-emerald-500",
                PUT: "bg-orange-500/10 border-orange-500",
                DELETE: "bg-red-500/10 border-red-500",
              };

              const colorClass = colors[config.key] || "text-foreground bg-muted border-border";
              const activeClass = activeColors[config.key] || "bg-primary/10 border-primary";

              return (
                <div key={config.key} className="space-y-2">
                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                      ? `${activeClass} shadow-sm`
                      : `${colorClass} opacity-70 hover:opacity-100`
                      }`}
                    onClick={() =>
                      setSelectedMethods(prev => ({ ...prev, [config.key]: !prev[config.key] }))
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded border bg-background/50 uppercase tracking-wider`}>
                          {config.label}
                        </span>
                        <code className="text-xs font-medium opacity-80">{config.route}</code>
                      </div>
                      {isSelected ? (
                        <div className="h-6 w-6 rounded-full bg-background/20 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border border-foreground/10"></div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMethodModal(config.key);
                          }}
                          className="h-6 px-2 text-[10px] hover:bg-background/20"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right panel - Schema & Mock Data */}
        <Card className="lg:col-span-1 bg-card/50 backdrop-blur-sm border-muted-foreground/10 flex flex-col h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Schema</CardTitle>
                <CardDescription>Define your resource structure</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateMockData}
                className="h-8 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary"
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Auto-Generate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-t-md border-x border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold pl-1">JSON Editor</span>
                <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                  ARRAY OF OBJECTS
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFormatJson}
                  className="h-7 w-7 p-0 hover:bg-background/80"
                  title="Format JSON"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-7 w-7 p-0 hover:bg-background/80"
                  title="Copy JSON"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="border-x border-b border-border/50 rounded-b-md overflow-hidden -mt-4 bg-background/50 flex-1">
              <CodeMirror
                value={jsonSchema}
                height="500px"
                extensions={[json()]}
                theme={isDarkMode ? oneDark : undefined}
                onChange={handleJsonChange}
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
                placeholder="Paste your JSON data here or use the Generate Sample Data button..."
                className="text-sm"
              />
            </div>

            {jsonError ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-500 text-[10px] font-bold">!</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5">Validation Error</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 break-all font-mono">{jsonError}</p>
                  </div>
                </div>
              </div>
            ) : jsonSchema.trim() && (
              (() => {
                try {
                  const parsed = JSON.parse(jsonSchema);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    return (
                      <div className="p-2 px-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                          <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                            Valid Schema
                          </p>
                        </div>
                        <span className="text-[10px] bg-green-500/10 px-2 py-0.5 rounded-full text-green-700 dark:text-green-400 font-mono">
                          {parsed.length} items
                        </span>
                      </div>
                    );
                  }
                } catch {
                  return null;
                }
                return null;
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={saveResource}
          disabled={
            isSaving ||
            !endpointName.trim() ||
            !baseSlug.trim() ||
            Object.values(selectedMethods).every(v => !v) ||
            !!jsonError ||
            !jsonSchema.trim()
          }
          size="lg"
          title={
            jsonError
              ? `Cannot create resource: ${jsonError}`
              : !endpointName.trim()
                ? "Please enter a resource name"
                : !baseSlug.trim()
                  ? "Please enter a slug"
                  : Object.values(selectedMethods).every(v => !v)
                    ? "Please select at least one method"
                    : !jsonSchema.trim()
                      ? "Please provide JSON data"
                      : undefined
          }
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

      {/* Primary Key Modal */}
      <Dialog open={isPrimaryKeyModalOpen} onOpenChange={setIsPrimaryKeyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Primary Key</DialogTitle>
            <DialogDescription>
              Choose the unique identifier field for this resource from the first object&apos;s keys.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Primary Key</Label>
            <Select value={primaryKey ?? undefined} onValueChange={setPrimaryKey}>
              <SelectTrigger>
                <SelectValue placeholder="Select a key" />
              </SelectTrigger>
              <SelectContent>
                {primaryKeyOptions.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsPrimaryKeyModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmPrimaryKeyAndSave} disabled={!primaryKey}>Confirm & Save</Button>
          </div>
        </DialogContent>
      </Dialog>
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

      {/* Sample Data Generator Dialog */}
      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Sample Data
            </DialogTitle>
            <DialogDescription>
              Choose a schema template and number of items to generate realistic sample data using Faker.js
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schema-select">Schema Template</Label>
              <Select value={selectedSchema} onValueChange={setSelectedSchema}>
                <SelectTrigger id="schema-select">
                  <SelectValue placeholder="Select a schema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User - Personal information, address, contact</SelectItem>
                  <SelectItem value="product">Product - E-commerce product details</SelectItem>
                  <SelectItem value="order">Order - Order with items and customer info</SelectItem>
                  <SelectItem value="blog">Blog Post - Article with content and metadata</SelectItem>
                  <SelectItem value="comment">Comment - User comments with engagement</SelectItem>
                  <SelectItem value="custom">Custom - Basic template based on resource name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-count">Number of Items</Label>
              <Input
                id="item-count"
                type="number"
                min="1"
                max="100"
                value={itemCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0 && val <= 100) {
                    setItemCount(val);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Generate between 1 and 100 items
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">Preview:</p>
              <p className="text-xs text-muted-foreground">
                Will generate {itemCount} {selectedSchema === 'custom' ? 'item' : selectedSchema}
                {itemCount !== 1 ? 's' : ''} with realistic sample data
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsGeneratorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateData}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
