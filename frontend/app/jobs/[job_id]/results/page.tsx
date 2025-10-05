"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  MdArrowBack,
  MdCheckCircle,
  MdError,
  MdTrendingUp,
  MdAccessTime,
  MdAssignment,
  MdCompare,
  MdCalendarToday,
  MdInventory,
  MdBuild,
  MdScience,
  MdBarChart,
  MdTimeline,
  MdSettings,
  MdList,
} from "react-icons/md";
import { jobsApi, type Job } from "@/lib/api/jobs";

interface JobResultSummary {
  objective_value: number;
  total_processed_kg: number;
  total_output_produced_kg: number;
  total_substitutes_made: number;
  total_initial_carriage_weight: number;
  total_final_carriage_weight: number;
  total_carried_weight_loss: number;
}

interface JobResultSchedule {
  week: number;
  recipe_id: string;
  processed_kg: number;
  is_running: boolean;
  materials_processed: Record<string, number>;
}

interface JobResultOutput {
  output_name: string;
  week: number;
  produced_kg: number;
  inventory_kg: number;
}

interface JobResultSubstitute {
  substitute_name: string;
  week: number;
  made: number;
  inventory: number;
  used_for_items: Record<string, number>;
}

interface JobResultSubstituteBreakdown {
  substitute_name: string;
  material_type: string;
  total_made: number;
  units_needed: number;
  ratio: number;
}

interface JobResultItem {
  item_name: string;
  week: number;
  used_total: number;
  used_carried: number;
  shortage: number;
}

interface JobResultWeightLoss {
  item_name: string;
  initial_units: number;
  units_used: number;
  final_units: number;
  mass_per_unit: number;
  initial_weight: number;
  final_weight: number;
  total_weight_loss: number;
}

export default function OptimizationResultsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.job_id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [summary, setSummary] = useState<JobResultSummary | null>(null);
  const [schedule, setSchedule] = useState<JobResultSchedule[]>([]);
  const [outputs, setOutputs] = useState<JobResultOutput[]>([]);
  const [substitutes, setSubstitutes] = useState<JobResultSubstitute[]>([]);
  const [substituteBreakdown, setSubstituteBreakdown] = useState<
    JobResultSubstituteBreakdown[]
  >([]);
  const [items, setItems] = useState<JobResultItem[]>([]);
  const [weightLoss, setWeightLoss] = useState<JobResultWeightLoss[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobResults = async () => {
      if (!jobId) return;

      try {
        setLoading(true);
        setError(null);

        // Load job details
        const jobData = await jobsApi.getJob(jobId);
        setJob(jobData);

        // Only load results if job is completed
        if (jobData.status === "completed") {
          try {
            const [
              summaryData,
              scheduleData,
              outputsData,
              substitutesData,
              itemsData,
              weightLossData,
            ] = await Promise.allSettled([
              jobsApi.getJobResultSummary(jobId),
              jobsApi.getJobResultSchedule(jobId),
              jobsApi.getJobResultOutputs(jobId),
              jobsApi.getJobResultSubstitutes(jobId),
              jobsApi.getJobResultItems(jobId),
              jobsApi.getJobResultWeightLoss(jobId),
            ]);

            // Handle each result, setting to empty if failed
            setSummary(
              summaryData.status === "fulfilled" ? summaryData.value : null
            );
            setSchedule(
              scheduleData.status === "fulfilled" ? scheduleData.value : []
            );
            setOutputs(
              outputsData.status === "fulfilled" ? outputsData.value : []
            );
            setSubstitutes(
              substitutesData.status === "fulfilled"
                ? substitutesData.value
                : []
            );
            setItems(itemsData.status === "fulfilled" ? itemsData.value : []);
            setWeightLoss(
              weightLossData.status === "fulfilled" ? weightLossData.value : []
            );
          } catch (resultError) {
            console.warn("Some result data could not be loaded:", resultError);
            // Continue with basic job data even if results fail
          }
        }
      } catch (err) {
        console.error("Failed to load job:", err);
        setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        setLoading(false);
      }
    };

    loadJobResults();
  }, [jobId]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "running":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <MdCheckCircle className="h-5 w-5" />;
      case "running":
        return <MdAccessTime className="h-5 w-5 animate-spin" />;
      case "failed":
        return <MdError className="h-5 w-5" />;
      default:
        return <MdAssignment className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Optimization Results
            </h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">
                Loading optimization results...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Optimization Results
            </h1>
            <p className="text-muted-foreground mt-1">Error loading results</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <MdError className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-muted-foreground">
                {error || "Job not found"}
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = job.status === "completed";
  const isSuccessful = isCompleted && summary !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <MdArrowBack className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              isSuccessful ? (
                <MdCheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <MdError className="w-6 h-6 text-red-500" />
              )
            ) : (
              <MdAccessTime className="w-6 h-6 text-blue-500" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {job.name || `Job ${job.id.slice(0, 8)}`}
              </h1>
              <p className="text-muted-foreground mt-1">Optimization Results</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted && isSuccessful && (
            <Button
              onClick={() => router.push(`/scheduler?job=${job.id}`)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <MdCalendarToday className="w-4 h-4" />
              View Schedule
            </Button>
          )}
          <Badge
            variant={
              isCompleted
                ? isSuccessful
                  ? "default"
                  : "destructive"
                : "secondary"
            }
          >
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Job Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Job Overview</CardTitle>
          <CardDescription>
            Basic information about this optimization job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MdAssignment className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Mission</span>
              </div>
              <p className="text-lg">{job.missionId || "Not specified"}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MdAccessTime className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <p className="text-lg">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>

            {job.startedAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MdAccessTime className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Started</span>
                </div>
                <p className="text-lg">
                  {new Date(job.startedAt).toLocaleString()}
                </p>
              </div>
            )}

            {job.completedAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MdCheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <p className="text-lg">
                  {new Date(job.completedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {job.error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
              <MdError className="w-5 h-5" />
              Error Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">{job.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      {isCompleted && isSuccessful && summary && (
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <MdTrendingUp className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <MdTimeline className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="outputs" className="flex items-center gap-2">
              <MdScience className="w-4 h-4" />
              Outputs
            </TabsTrigger>
            <TabsTrigger
              value="substitutes"
              className="flex items-center gap-2"
            >
              <MdBuild className="w-4 h-4" />
              Substitutes
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <MdInventory className="w-4 h-4" />
              Items
            </TabsTrigger>
            <TabsTrigger value="weight" className="flex items-center gap-2">
              <MdBarChart className="w-4 h-4" />
              Weight Analysis
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdTrendingUp className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators for this optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 border border-green-200 bg-green-100 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {summary.objective_value.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-green-800 dark:text-green-200 mt-1">
                      Objective Value
                    </div>
                  </div>

                  <div className="text-center p-6 border border-blue-200 bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg">
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {summary.total_processed_kg.toFixed(1)}kg
                    </div>
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mt-1">
                      Total Processed
                    </div>
                  </div>

                  <div className="text-center p-6 border border-purple-200 bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 rounded-lg">
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {summary.total_output_produced_kg.toFixed(1)}kg
                    </div>
                    <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mt-1">
                      Output Produced
                    </div>
                  </div>

                  <div className="text-center p-6 border border-orange-200 bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 rounded-lg">
                    <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {summary.total_substitutes_made}
                    </div>
                    <div className="text-sm font-medium text-orange-800 dark:text-orange-200 mt-1">
                      Substitutes Made
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Initial Carriage Weight
                      </span>
                      <span className="text-lg font-bold">
                        {summary.total_initial_carriage_weight.toFixed(1)}kg
                      </span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Final Carriage Weight
                      </span>
                      <span className="text-lg font-bold">
                        {summary.total_final_carriage_weight.toFixed(1)}kg
                      </span>
                    </div>
                    <Progress
                      value={
                        (summary.total_final_carriage_weight /
                          summary.total_initial_carriage_weight) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600">
                        Weight Reduction
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {summary.total_carried_weight_loss.toFixed(1)}kg
                      </span>
                    </div>
                    <Progress
                      value={
                        (summary.total_carried_weight_loss /
                          summary.total_initial_carriage_weight) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdTimeline className="w-5 h-5" />
                  Production Schedule
                </CardTitle>
                <CardDescription>
                  Weekly production schedule and material processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(schedule.map((s) => s.week)))
                    .sort()
                    .map((week) => {
                      const weekSchedule = schedule.filter(
                        (s) => s.week === week
                      );
                      return (
                        <div key={week} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">Week {week}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {weekSchedule.map((item, index) => (
                              <div
                                key={index}
                                className="bg-muted/50 p-3 rounded"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    Recipe {item.recipe_id.slice(0, 8)}
                                  </span>
                                  <Badge
                                    variant={
                                      item.is_running ? "default" : "secondary"
                                    }
                                  >
                                    {item.is_running ? "Running" : "Idle"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Processed: {item.processed_kg.toFixed(1)}kg
                                </div>
                                {Object.keys(item.materials_processed).length >
                                  0 && (
                                  <div className="mt-2 text-xs">
                                    {Object.entries(
                                      item.materials_processed
                                    ).map(([material, amount]) => (
                                      <div
                                        key={material}
                                        className="flex justify-between"
                                      >
                                        <span>{material}:</span>
                                        <span>
                                          {Number(amount).toFixed(1)}kg
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outputs Tab */}
          <TabsContent value="outputs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdScience className="w-5 h-5" />
                  Output Production
                </CardTitle>
                <CardDescription>
                  Weekly output production and inventory levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Array.from(new Set(outputs.map((o) => o.output_name))).map(
                    (outputName) => {
                      const outputData = outputs
                        .filter((o) => o.output_name === outputName)
                        .sort((a, b) => a.week - b.week);
                      return (
                        <div key={outputName} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">{outputName}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {outputData.map((item, index) => (
                              <div
                                key={index}
                                className="bg-muted/50 p-3 rounded text-center"
                              >
                                <div className="text-sm text-muted-foreground">
                                  Week {item.week}
                                </div>
                                <div className="text-lg font-bold text-blue-600">
                                  {item.produced_kg.toFixed(1)}kg
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Produced
                                </div>
                                <div className="text-sm font-medium mt-1">
                                  {item.inventory_kg.toFixed(1)}kg
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Inventory
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Substitutes Tab */}
          <TabsContent value="substitutes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdBuild className="w-5 h-5" />
                  Substitute Production
                </CardTitle>
                <CardDescription>
                  Weekly substitute manufacturing and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Array.from(
                    new Set(substitutes.map((s) => s.substitute_name))
                  ).map((substituteName) => {
                    const substituteData = substitutes
                      .filter((s) => s.substitute_name === substituteName)
                      .sort((a, b) => a.week - b.week);
                    return (
                      <div
                        key={substituteName}
                        className="border rounded-lg p-4"
                      >
                        <h4 className="font-semibold mb-3">{substituteName}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {substituteData.map((item, index) => (
                            <div
                              key={index}
                              className="bg-muted/50 p-3 rounded"
                            >
                              <div className="text-center mb-2">
                                <div className="text-sm text-muted-foreground">
                                  Week {item.week}
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  {item.made}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Made
                                </div>
                              </div>
                              <div className="text-sm">
                                <div className="flex justify-between">
                                  <span>Inventory:</span>
                                  <span className="font-medium">
                                    {item.inventory}
                                  </span>
                                </div>
                              </div>
                              {Object.keys(item.used_for_items).length > 0 && (
                                <div className="mt-2 text-xs">
                                  <div className="text-muted-foreground mb-1">
                                    Used for:
                                  </div>
                                  {Object.entries(item.used_for_items).map(
                                    ([itemName, amount]) => (
                                      <div
                                        key={itemName}
                                        className="flex justify-between"
                                      >
                                        <span>{itemName}:</span>
                                        <span>{Number(amount)}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdInventory className="w-5 h-5" />
                  Item Usage
                </CardTitle>
                <CardDescription>
                  Weekly item consumption and shortage analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Array.from(new Set(items.map((i) => i.item_name))).map(
                    (itemName) => {
                      const itemData = items
                        .filter((i) => i.item_name === itemName)
                        .sort((a, b) => a.week - b.week);
                      return (
                        <div key={itemName} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">{itemName}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {itemData.map((item, index) => (
                              <div
                                key={index}
                                className="bg-muted/50 p-3 rounded text-center"
                              >
                                <div className="text-sm text-muted-foreground mb-2">
                                  Week {item.week}
                                </div>
                                <div className="space-y-1">
                                  <div>
                                    <div className="text-lg font-bold">
                                      {item.used_total}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Total Used
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-blue-600">
                                      {item.used_carried}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      From Carried
                                    </div>
                                  </div>
                                  {item.shortage > 0 && (
                                    <div>
                                      <div className="text-sm font-medium text-red-600">
                                        {item.shortage}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Shortage
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weight Analysis Tab */}
          <TabsContent value="weight" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdBarChart className="w-5 h-5" />
                  Weight Loss Analysis
                </CardTitle>
                <CardDescription>
                  Carriage weight reduction by item category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {weightLoss.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">{item.item_name}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Initial Units:
                          </span>
                          <span className="font-medium">
                            {item.initial_units}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Units Used:
                          </span>
                          <span className="font-medium">{item.units_used}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Final Units:
                          </span>
                          <span className="font-medium">
                            {item.final_units}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Mass per Unit:
                          </span>
                          <span className="font-medium">
                            {item.mass_per_unit.toFixed(2)}kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Initial Weight:
                          </span>
                          <span className="font-medium">
                            {item.initial_weight.toFixed(1)}kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Final Weight:
                          </span>
                          <span className="font-medium">
                            {item.final_weight.toFixed(1)}kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/20 rounded">
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Weight Saved:
                          </span>
                          <span className="font-bold text-green-800 dark:text-green-200">
                            {item.total_weight_loss.toFixed(1)}kg
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Job Still Running */}
      {!isCompleted && job.status === "running" && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Job is still running...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
