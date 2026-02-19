"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useUser } from "@clerk/nextjs";
import { Plus, Trash2, Copy, Edit, Rocket, BookText, Check, BarChart3, FolderOpen, Activity, TrendingUp, Zap, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { DeployModal, type Project } from "@/components/deploy-modal";
import { motion } from "framer-motion";

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

type ProjectUsage = {
  currentUsage: number;
  maxLimit: number;
};

type AnalyticsData = {
  totalRequests: number;
  cacheHitRate: number;
  rateLimitRemaining: number;
  requestsToday: number;
  requestsLimit: number;
  hourlyRequests: Array<{ hour: string; requests: number }>;
  cacheStats: Array<{ date: string; hitRate: number }>;
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
  const [usage, setUsage] = useState<ProjectUsage | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");

  // Empty analytics data for fresh projects
  const emptyAnalytics: AnalyticsData = {
    totalRequests: 0,
    cacheHitRate: 0,
    rateLimitRemaining: 100, // Default starting limit
    requestsToday: 0,
    requestsLimit: 100,
    hourlyRequests: Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(i, 0, 0, 0);
      return {
        hour: hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        requests: 0,
      };
    }),
    cacheStats: Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hitRate: 0,
      };
    }),
  };

  // Calculate time until midnight (daily reset)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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

        // Get usage data
        try {
          const usageRes = await axios.get(`${API_BASE_URL}/api/projects/${projectId}/usage`, {
            headers: { "User-Id": user?.id || "" },
          });
          if (!cancelled) {
            setUsage(usageRes.data);
          }
        } catch (usageError) {
          console.error("Failed to load usage data:", usageError);
          if (!cancelled) {
            // Default to 0 usage if API fails (e.g. 404 for new project)
            setUsage({ currentUsage: 0, maxLimit: 100 });
          }
        } finally {
          if (!cancelled) setIsLoadingUsage(false);
        }

        // Get analytics data
        try {
          const analyticsRes = await axios.get(`${API_BASE_URL}/api/projects/${projectId}/analytics`, {
            headers: { "User-Id": user?.id || "" },
          });
          if (!cancelled) {
            setAnalytics(analyticsRes.data);
          }
        } catch (analyticsError) {
          // Suppress error log to avoid dev overlay for 404/429 on new projects
          // console.error("Failed to load analytics data:", analyticsError);
          if (!cancelled) {
            // Use empty data if API fails (e.g. 404 for new project)
            setAnalytics(emptyAnalytics);
          }
        }
      } catch (e) {
        console.error("Failed to load project/resources from API:", e);
        if (!cancelled) {
          setProject(null);
          setResources([]);
          // Set empty analytics even on error
          setAnalytics(emptyAnalytics);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, user?.id]);

  const deployProject = async (projectToDeploy: Project) => {
    setIsDeploying(true);
    try {
      await axios.put(`${API_BASE_URL}/api/projects/${projectToDeploy.id}/deploy`, {}, {
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
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 border-muted-foreground/10">
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
      <main className="mx-auto max-w-7xl px-4 py-10">
        <Card className="max-w-md mx-auto bg-card/50 backdrop-blur-sm">
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

  const totalResources = resources.length;
  const totalEndpoints = resources.reduce((sum, r) => sum + (r.enabledMethods?.length || 0), 0);

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
              <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight gradient-text">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.description || "Manage endpoints for this project."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.slug && (
            <Button
              asChild
              variant="outline"
              disabled={resources.length === 0}
              size="sm"
              className="bg-background/50 backdrop-blur-sm"
            >
              <Link href={`/api/docs/${project.slug}`} target="_blank">
                <BookText className="h-4 w-4 mr-2" />
                Documentation
              </Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href={`/dashboard/${project.id}/endpoints/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Resource
            </Link>
          </Button>
          {project.status !== 'DEPLOYED' && resources.length > 0 && (
            <Button
              variant="default"
              onClick={() => setShowDeployDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
              size="sm"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          )}
        </div>
      </div>

      {resources.length > 0 && (
        <>
          {/* Request Usage Card - Today's Usage with Countdown */}
          <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Request Usage</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingUsage ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (() => {
                const requestsToday = analytics?.requestsToday || usage?.currentUsage || 0;
                const requestsLimit = analytics?.requestsLimit || usage?.maxLimit || 100;
                const usagePercent = requestsLimit > 0 ? (requestsToday / requestsLimit) * 100 : 0;
                const isHighUsage = usagePercent >= 80;
                const isWarningUsage = usagePercent >= 60;



                return (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold">
                        Used {requestsToday.toLocaleString()}
                        <span className="text-lg font-normal text-muted-foreground ml-1">
                          / {requestsLimit.toLocaleString()} requests today
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Progress
                        value={usagePercent}
                        className={`h-3 ${isHighUsage ? '[&>div]:bg-red-500' : isWarningUsage ? '[&>div]:bg-orange-500' : '[&>div]:bg-blue-500'}`}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${isHighUsage ? 'text-red-600 dark:text-red-400 font-medium' : isWarningUsage ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                          {usagePercent.toFixed(1)}% of daily limit used
                        </span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Resets in {timeUntilReset}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 hover:border-primary/20 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resources</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalResources}</div>
                <p className="text-xs text-muted-foreground">
                  Total resources
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 hover:border-primary/20 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEndpoints}</div>
                <p className="text-xs text-muted-foreground">
                  Active endpoints
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 hover:border-primary/20 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.status === 'DEPLOYED' ? 'Live' : 'Draft'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {project.status || 'DRAFT'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10 hover:border-primary/20 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rate Limit Remaining</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <>
                    <div className="text-2xl font-bold">{analytics.rateLimitRemaining}</div>
                    <p className="text-xs text-muted-foreground">
                      Requests remaining
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Total Requests Card */}
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Total Requests
                </CardTitle>
                <CardDescription>Requests over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">{analytics.totalRequests.toLocaleString()}</div>
                    <ChartContainer
                      config={{
                        requests: {
                          label: "Requests",
                          color: "var(--chart-1)",
                        },
                      }}
                      className="h-[200px]"
                    >
                      <AreaChart data={analytics.hourlyRequests}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="hour"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value.split(' ')[0]}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="requests"
                          stroke="var(--chart-1)"
                          fill="var(--chart-1)"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cache Hit % Card */}
            <Card className="bg-card/50 backdrop-blur-sm border-muted-foreground/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Cache Hit Rate
                </CardTitle>
                <CardDescription>Cache performance over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">{analytics.cacheHitRate.toFixed(1)}%</div>
                    <ChartContainer
                      config={{
                        hitRate: {
                          label: "Hit Rate",
                          color: "var(--chart-2)",
                        },
                      }}
                      className="h-[200px]"
                    >
                      <BarChart data={analytics.cacheStats}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="hitRate"
                          fill="var(--chart-2)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Separator />

      {resources.length === 0 ? (
        <Card className="border-dashed bg-muted/20 border-muted-foreground/20 max-w-lg">
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No resources yet</CardTitle>
            <CardDescription className="mt-2 text-base">
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
            const methodColors: { [key: string]: string } = {
              'GET': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
              'POST': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
              'PUT': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
              'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
              'PATCH': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            };

            return (
              <Card key={resource.id} className="hover:shadow-lg transition-all duration-200 group bg-card/80 backdrop-blur-sm border-muted-foreground/10 hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">{resource.name}</h3>
                      <code className="text-xs font-mono text-muted-foreground">/{resource.slug}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(baseUrl);
                        toast.success("Copied to clipboard");
                        const key = `base-${resource.id}`;
                        setCopiedKey(key);
                        setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
                      }}
                    >
                      {copiedKey === `base-${resource.id}` ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                  {resource.description && (
                    <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
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
                              className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
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
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" asChild className="hover:bg-primary/10 hover:text-primary transition-colors">
                        <Link href={`/dashboard/${project.id}/endpoints/${resource.id}`}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setResourceToDelete(resource); setDeleteDialogOpen(true); }}>
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
              <div className="rounded-md border p-3 bg-muted/50">
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

      {/* Deploy Dialog - Using reusable component */}
      <DeployModal
        open={showDeployDialog}
        onOpenChange={setShowDeployDialog}
        project={project}
        onDeploy={deployProject}
        isDeploying={isDeploying}
      />
    </main>
  );
}
