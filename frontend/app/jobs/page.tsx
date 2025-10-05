"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MdPlayArrow,
  MdTune,
  MdCheckCircle,
  MdError,
  MdSchedule,
  MdPending,
  MdCancel,
  MdSearch,
  MdFilterList,
  MdArrowBack,
} from "react-icons/md";
import { missionsApi } from "@/lib/api/missions";
import { jobsApi, type Job } from "@/lib/api/jobs";

export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const missionId = searchParams.get("mission") || "";

  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [missionFilter, setMissionFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load all jobs and missions
        const missions = await missionsApi.getMissions();
        let jobs: Job[] = [];

        if (missionId) {
          jobs = await jobsApi.getJobsByMission(missionId);
        } else {
          // If you don't have a getAllJobs, you may need to fetch jobs for all missions or adjust this logic.
          // For now, we'll assume you want to fetch jobs for all missions and flatten the results.
          const jobsByMission = await Promise.all(
            missions.map((mission: any) => jobsApi.getJobsByMission(mission.id))
          );
          jobs = jobsByMission.flat();
        }

        setAllJobs(jobs);

        // If a specific mission is selected, load its details
        if (missionId) {
          const mission = missions.find((m) => m.id === missionId);
          setSelectedMission(mission || null);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [missionId]);

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      const matchesSearch =
        job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;
      const matchesType = typeFilter === "all" || job.type === typeFilter;
      const matchesMission =
        missionFilter === "all" ||
        (missionId && job.missionId === missionId) ||
        (!missionId && job.missionId === missionFilter);

      return matchesSearch && matchesStatus && matchesType && matchesMission;
    });
  }, [
    allJobs,
    searchQuery,
    statusFilter,
    typeFilter,
    missionFilter,
    missionId,
  ]);

  // Paginate jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJobs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, missionFilter]);

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "completed":
        return <MdCheckCircle className="w-4 h-4 text-green-500" />;
      case "running":
        return <MdSchedule className="w-4 h-4 text-blue-500" />;
      case "failed":
        return <MdError className="w-4 h-4 text-red-500" />;
      case "pending":
        return <MdPending className="w-4 h-4 text-yellow-500" />;
      case "cancelled":
        return <MdCancel className="w-4 h-4 text-gray-500" />;
      case "draft":
      case "entities_config":
      case "inventory_config":
      case "demands_config":
      case "resources_config":
      case "ready":
        return <MdTune className="w-4 h-4 text-purple-500" />;
      default:
        return <MdPending className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: Job["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "running":
        return "secondary";
      case "failed":
        return "destructive";
      case "pending":
        return "outline";
      case "cancelled":
        return "secondary";
      case "draft":
      case "entities_config":
      case "inventory_config":
      case "demands_config":
      case "resources_config":
      case "ready":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: Job["status"]) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "entities_config":
        return "Configuring Entities";
      case "inventory_config":
        return "Setting Inventories";
      case "demands_config":
        return "Configuring Demands";
      case "resources_config":
        return "Setting Resources";
      case "ready":
        return "Ready to Run";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header with NASA-style typography */}
        <div className="relative">
          <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4 font-technical">
            {missionId ? "MISSION JOBS" : "ALL JOBS"}
          </h1>
          <p className="text-muted-foreground mt-2 font-technical tracking-wide">
            Loading optimization jobs • Sol {new Date().getFullYear() - 2020 + 1}
          </p>
        </div>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
              </div>
              <p className="text-muted-foreground font-technical">Loading jobs catalog...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header with NASA-style typography */}
        <div className="relative">
          <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4 font-technical">
            {missionId ? "MISSION JOBS" : "ALL JOBS"}
          </h1>
          <p className="text-muted-foreground mt-2 font-technical tracking-wide">
            Error loading optimization jobs • Sol {new Date().getFullYear() - 2020 + 1}
          </p>
        </div>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <MdError className="w-12 h-12 text-red-500 mx-auto" />
              <div>
                <p className="text-red-600 font-medium font-technical">Failed to load jobs</p>
                <p className="text-muted-foreground text-sm mt-1 font-technical">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 font-technical"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with NASA-style typography */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4 font-technical">
          {missionId ? "MISSION JOBS" : "ALL JOBS"}
        </h1>
        <p className="text-muted-foreground mt-2 font-technical tracking-wide">
          {missionId && selectedMission
            ? `Jobs for: ${selectedMission.name} • Sol ${new Date().getFullYear() - 2020 + 1}`
            : `View and manage all optimization jobs • Sol ${new Date().getFullYear() - 2020 + 1}`}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {missionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/missions")}
              className="gap-2 hover:bg-muted font-technical"
            >
              <MdArrowBack className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-technical">
            <span>
              <strong className="text-foreground">{filteredJobs.length}</strong> jobs
            </span>
            <span>•</span>
            <span>
              <strong className="text-foreground">{allJobs.length}</strong> total
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              router.push(`/jobs/new${missionId ? `?mission=${missionId}` : ""}`)
            }
            className="gap-2 font-technical"
          >
            <MdPlayArrow className="w-4 h-4" />
            Create New Job
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {/* Search and Filters Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-technical tracking-wide">JOB MANAGEMENT</CardTitle>
                <CardDescription className="font-technical text-xs tracking-wider uppercase">
                  Optimization and analysis jobs • Mars operations
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-technical text-green-400">LIVE</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search jobs by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-technical"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 font-technical">
                    <MdFilterList className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="entities_config">
                      Configuring Entities
                    </SelectItem>
                    <SelectItem value="inventory_config">
                      Setting Inventories
                    </SelectItem>
                    <SelectItem value="demands_config">
                      Configuring Demands
                    </SelectItem>
                    <SelectItem value="resources_config">
                      Setting Resources
                    </SelectItem>
                    <SelectItem value="ready">Ready to Run</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32 font-technical">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="optimization">Optimization</SelectItem>
                    <SelectItem value="scheduling">Scheduling</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="simulation">Simulation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredJobs.length === 0 ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground font-technical">
                  {allJobs.length === 0
                    ? missionId
                      ? "No jobs found for this mission"
                      : "No jobs found"
                    : "No jobs match your current filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            paginatedJobs.map((job: Job) => (
              <Card key={job.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <CardTitle className="text-lg font-technical">{job.name}</CardTitle>
                        <CardDescription className="font-technical">
                          {job.type.charAt(0).toUpperCase() + job.type.slice(1)}{" "}
                          Job • Created{" "}
                          {new Date(job.createdAt).toLocaleDateString()}
                          {job.missionId && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              Mission ID: {job.missionId}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(job.status)} className="font-technical">
                      {getStatusLabel(job.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.status === "running" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="w-full" />
                      </div>
                    )}

                    {job.error && (
                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded font-technical">
                        Error: {job.error}
                      </div>
                    )}

                    {/* Action buttons for draft/configuration jobs */}
                    {(job.status === "draft" ||
                      job.status === "entities_config" ||
                      job.status === "inventory_config" ||
                      job.status === "demands_config" ||
                      job.status === "resources_config") && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                          className="gap-1 font-technical"
                        >
                          Continue Setup
                        </Button>
                      </div>
                    )}

                    {job.status === "ready" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            // TODO: Implement run job functionality
                            console.log("Run job:", job.id);
                          }}
                          className="gap-1 font-technical"
                        >
                          <MdPlayArrow className="w-4 h-4" />
                          Run Job
                        </Button>
                      </div>
                    )}

                    {job.status === "completed" && !job.result?.success && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/jobs/${job.id}/results`)}
                          className="gap-1 font-technical"
                        >
                          View Details
                        </Button>
                      </div>
                    )}

                    {job.result && job.result.success && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium font-technical">Optimization Results</h4>
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/jobs/${job.id}/results`)
                            }
                            className="gap-1 font-technical"
                          >
                            View Results
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {/* Enhanced Objective Function Score */}
                          <div className="border border-green-200 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-green-800 dark:text-green-200">
                                Optimization Score
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                {job.result.metrics.optimizationScore >= 8
                                  ? "🏆 Excellent"
                                  : job.result.metrics.optimizationScore >= 6
                                  ? "⭐ Good"
                                  : job.result.metrics.optimizationScore >= 4
                                  ? "✅ Fair"
                                  : "⚠️ Needs Improvement"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {job.result.metrics.optimizationScore.toFixed(
                                  1
                                )}
                              </div>
                              <div className="text-sm text-green-700 dark:text-green-300">
                                /10
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${
                                      (job.result.metrics.optimizationScore /
                                        10) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                              {job.result.metrics.optimizationScore >= 8
                                ? "Outstanding performance across all metrics"
                                : job.result.metrics.optimizationScore >= 6
                                ? "Strong optimization with good efficiency"
                                : job.result.metrics.optimizationScore >= 4
                                ? "Decent optimization with room for improvement"
                                : "Consider reviewing mission parameters"}
                            </div>
                          </div>

                          {/* Enhanced Duration */}
                          <div className="border border-blue-200 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 dark:border-blue-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-blue-800 dark:text-blue-200">
                                Processing Time
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                {job.result.metrics.duration < 5
                                  ? "⚡ Fast"
                                  : job.result.metrics.duration < 15
                                  ? "🕐 Normal"
                                  : "⏳ Slow"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {job.result.metrics.duration}
                              </div>
                              <div className="text-sm text-blue-700 dark:text-blue-300">
                                minutes
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                              {job.result.metrics.duration < 5
                                ? "Excellent performance"
                                : job.result.metrics.duration < 15
                                ? "Good performance"
                                : "Consider optimization"}
                            </div>
                          </div>

                          {/* Enhanced Items Processed */}
                          <div className="border border-purple-200 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 dark:border-purple-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-purple-800 dark:text-purple-200">
                                Items Processed
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">
                                {job.result.metrics.itemsProcessed > 100
                                  ? "🔥 High Volume"
                                  : job.result.metrics.itemsProcessed > 50
                                  ? "📦 Medium"
                                  : "📋 Low Volume"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {job.result.metrics.itemsProcessed}
                              </div>
                              <div className="text-sm text-purple-700 dark:text-purple-300">
                                items
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                              {job.result.metrics.itemsProcessed > 100
                                ? "High throughput achieved"
                                : job.result.metrics.itemsProcessed > 50
                                ? "Moderate processing"
                                : "Light processing load"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-technical">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of{" "}
              {filteredJobs.length} jobs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="font-technical"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNumber > totalPages) return null;

                  return (
                    <Button
                      key={pageNumber}
                      variant={
                        pageNumber === currentPage ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="w-8 h-8 p-0 font-technical"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="font-technical"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
