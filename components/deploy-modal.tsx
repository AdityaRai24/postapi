"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Rocket, Globe, Layers } from "lucide-react";
import toast from "react-hot-toast";

// Defined locally to match the structure used in dashboard
// In a real app, this should be in a shared types file (e.g., types/index.ts)
export type Project = {
    id: string;
    name: string;
    description?: string;
    slug?: string;
    deployedLink?: string;
    userId: string;
    status: "DRAFT" | "DEPLOYED" | "ARCHIVED";
    endpoints: unknown[];
    createdAt: string;
    updatedAt: string;
};

interface DeployModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project | null;
    onDeploy: (project: Project) => void;
    isDeploying: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export function DeployModal({
    open,
    onOpenChange,
    project,
    onDeploy,
    isDeploying,
}: DeployModalProps) {
    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {project.status === "DEPLOYED"
                            ? "Deployment Information"
                            : "Deploy Project"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {project.status === "DEPLOYED" && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                    Project is currently deployed and live
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Project Information</Label>
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2 border border-border/50">
                            <div>
                                <span className="font-medium">Name: </span>
                                <span>{project.name}</span>
                            </div>
                            <div>
                                <span className="font-medium">Description: </span>
                                <span>{project.description || "No description"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Status: </span>
                                <Badge variant="outline">{project.status}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deployed-url">
                            {project.status === "DEPLOYED"
                                ? "Current Deployed URL"
                                : "Deployed URL"}
                        </Label>
                        <div className="relative">
                            <Input
                                id="deployed-url"
                                value={
                                    project.deployedLink ||
                                    `${API_BASE_URL}/api/${project.slug || "project-slug"}`
                                }
                                readOnly
                                className="bg-muted pr-10"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        project.deployedLink ||
                                        `${API_BASE_URL}/api/${project.slug || "project-slug"}`
                                    );
                                    toast.success("Copied to clipboard");
                                }}
                            >
                                <Layers className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {project.status === "DEPLOYED"
                                ? "This URL is currently live and accessible"
                                : "This URL will be available after deployment"}
                        </p>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    {project.status === "DEPLOYED" ? (
                        <div className="flex w-full gap-2">
                            {project.slug && (
                                <Button asChild variant="secondary" className="flex-1">
                                    <Link href={`/docs/${project.slug}`} target="_blank">
                                        <Globe className="h-4 w-4 mr-2" />
                                        View Docs
                                    </Link>
                                </Button>
                            )}
                            <Button onClick={() => onOpenChange(false)} className="flex-1">
                                Close
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isDeploying}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => onDeploy(project)}
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
    );
}
