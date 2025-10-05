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
  MdShowChart,
  MdPieChart,
  MdStackedLineChart,
  MdAnalytics,
} from "react-icons/md";
import { jobsApi, type Job } from "@/lib/api/jobs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";

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

        // Debug: Check job data
        try {
          const debugData = await jobsApi.debugJobData(jobId);
          console.log("Debug job data:", debugData);
        } catch (debugError) {
          console.warn("Debug call failed:", debugError);
        }

        // Only load results if job is completed
        if (jobData.status === "completed") {
          try {
            console.log("Loading results for completed job:", jobId);

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

            console.log("API Results:", {
              summary: summaryData,
              schedule: scheduleData,
              outputs: outputsData,
              substitutes: substitutesData,
              items: itemsData,
              weightLoss: weightLossData,
            });

            // Handle each result, setting to empty if failed
            const summary =
              summaryData.status === "fulfilled" ? summaryData.value : null;
            const schedule =
              scheduleData.status === "fulfilled" ? scheduleData.value : [];
            const outputs =
              outputsData.status === "fulfilled" ? outputsData.value : [];
            const substitutes =
              substitutesData.status === "fulfilled"
                ? substitutesData.value
                : [];
            const items =
              itemsData.status === "fulfilled" ? itemsData.value : [];
            const weightLoss =
              weightLossData.status === "fulfilled" ? weightLossData.value : [];

            console.log("Processed data:", {
              summary,
              schedule: schedule.length,
              outputs: outputs.length,
              substitutes: substitutes.length,
              items: items.length,
              weightLoss: weightLoss.length,
            });

            setSummary(summary);
            setSchedule(schedule);
            setOutputs(outputs);
            setSubstitutes(substitutes);
            setItems(items);
            setWeightLoss(weightLoss);
          } catch (resultError) {
            console.error("Error loading result data:", resultError);
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

  // Chart data processing functions
  const getWeeklyUtilizationData = () => {
    const weeklyData: { [key: string]: any } = {};

    schedule.forEach((item) => {
      if (!weeklyData[item.week]) {
        weeklyData[item.week] = {
          week: `Week ${item.week}`,
          totalProcessed: 0,
          methods: {},
        };
      }
      weeklyData[item.week].totalProcessed += item.processed_kg;
      weeklyData[item.week].methods[item.recipe_id.slice(0, 8)] =
        item.processed_kg;
    });

    return Object.values(weeklyData).sort(
      (a, b) => parseInt(a.week.split(" ")[1]) - parseInt(b.week.split(" ")[1])
    );
  };

  const getMethodUtilizationData = () => {
    const methodData: { [key: string]: number } = {};

    schedule.forEach((item) => {
      const methodKey = item.recipe_id.slice(0, 8);
      methodData[methodKey] = (methodData[methodKey] || 0) + item.processed_kg;
    });

    return Object.entries(methodData).map(([method, processed]) => ({
      method,
      processed: Number(processed.toFixed(1)),
      percentage: Number(
        (
          (processed /
            schedule.reduce((sum, item) => sum + item.processed_kg, 0)) *
          100
        ).toFixed(1)
      ),
    }));
  };

  const getWeightReductionData = () => {
    if (!summary) return [];

    return [
      {
        name: "Initial Weight",
        value: summary.total_initial_carriage_weight,
        fill: "#3b82f6",
      },
      {
        name: "Final Weight",
        value: summary.total_final_carriage_weight,
        fill: "#10b981",
      },
      {
        name: "Weight Saved",
        value: summary.total_carried_weight_loss,
        fill: "#f59e0b",
      },
    ];
  };

  const getObjectiveMetricsData = () => {
    if (!summary) return [];

    // Calculate efficiency metrics
    const processingEfficiency =
      summary.total_processed_kg > 0
        ? (summary.total_output_produced_kg / summary.total_processed_kg) * 100
        : 0;

    const weightReductionEfficiency =
      summary.total_initial_carriage_weight > 0
        ? (summary.total_carried_weight_loss /
            summary.total_initial_carriage_weight) *
          100
        : 0;

    return [
      {
        name: "Objective Value",
        value: summary.objective_value,
        color: "#8b5cf6",
        description: "Optimization Score",
        unit: "points",
      },
      {
        name: "Processing Efficiency",
        value: processingEfficiency,
        color: "#06b6d4",
        description: "Output/Input Ratio",
        unit: "%",
      },
      {
        name: "Weight Reduction",
        value: weightReductionEfficiency,
        color: "#10b981",
        description: "Mass Savings",
        unit: "%",
      },
      {
        name: "Substitute Production",
        value: summary.total_substitutes_made,
        color: "#f59e0b",
        description: "Items Manufactured",
        unit: "units",
      },
    ];
  };

  const getObjectiveFunctionInsights = () => {
    if (!summary) return [];

    const insights = [];

    // Objective function analysis
    if (summary.objective_value > 0) {
      insights.push({
        type: "success",
        icon: "🎯",
        title: "Optimization Successful",
        description: `Achieved objective value of ${summary.objective_value.toFixed(
          2
        )} points`,
        value: summary.objective_value,
      });
    }

    // Processing efficiency
    const efficiency =
      summary.total_processed_kg > 0
        ? (summary.total_output_produced_kg / summary.total_processed_kg) * 100
        : 0;

    if (efficiency > 80) {
      insights.push({
        type: "excellent",
        icon: "⚡",
        title: "High Processing Efficiency",
        description: `${efficiency.toFixed(
          1
        )}% conversion rate from input to output`,
        value: efficiency,
      });
    } else if (efficiency > 60) {
      insights.push({
        type: "good",
        icon: "✅",
        title: "Good Processing Efficiency",
        description: `${efficiency.toFixed(1)}% conversion rate achieved`,
        value: efficiency,
      });
    }

    // Weight reduction
    const weightReduction =
      summary.total_initial_carriage_weight > 0
        ? (summary.total_carried_weight_loss /
            summary.total_initial_carriage_weight) *
          100
        : 0;

    if (weightReduction > 15) {
      insights.push({
        type: "excellent",
        icon: "🚀",
        title: "Significant Weight Reduction",
        description: `Reduced carriage weight by ${weightReduction.toFixed(
          1
        )}%`,
        value: weightReduction,
      });
    } else if (weightReduction > 5) {
      insights.push({
        type: "good",
        icon: "📉",
        title: "Moderate Weight Reduction",
        description: `Achieved ${weightReduction.toFixed(1)}% weight savings`,
        value: weightReduction,
      });
    }

    // Substitute production
    if (summary.total_substitutes_made > 0) {
      insights.push({
        type: "success",
        icon: "🔧",
        title: "Substitute Manufacturing",
        description: `Successfully manufactured ${summary.total_substitutes_made} substitute items`,
        value: summary.total_substitutes_made,
      });
    }

    return insights;
  };

  const getWeeklyTrendData = () => {
    const weeklyTrend: { [key: number]: any } = {};

    // Process schedule data
    schedule.forEach((item) => {
      if (!weeklyTrend[item.week]) {
        weeklyTrend[item.week] = {
          week: item.week,
          processed: 0,
          running: 0,
          produced: 0,
        };
      }
      weeklyTrend[item.week].processed += item.processed_kg;
      if (item.is_running) weeklyTrend[item.week].running += 1;
    });

    // Process outputs data
    outputs.forEach((output) => {
      if (!weeklyTrend[output.week]) {
        weeklyTrend[output.week] = {
          week: output.week,
          processed: 0,
          running: 0,
          produced: 0,
        };
      }
      weeklyTrend[output.week].produced += output.produced_kg || 0;
    });

    // Calculate efficiency for each week
    const trendData = Object.values(weeklyTrend).sort(
      (a, b) => a.week - b.week
    );

    return trendData.map((week) => ({
      ...week,
      efficiency:
        week.processed > 0 ? (week.produced / week.processed) * 100 : 0,
    }));
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
  const isSuccessful =
    isCompleted &&
    (summary !== null || schedule.length > 0 || outputs.length > 0);

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
      {isCompleted && isSuccessful && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <MdAnalytics className="w-4 h-4" />
              Overview
            </TabsTrigger>
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

          {/* Overview Tab with Charts */}
          <TabsContent value="overview" className="space-y-6">
            {summary ? (
              <>
                {/* Objective Function Hero Section */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                      <MdShowChart className="w-6 h-6" />
                      Optimization Performance Dashboard
                    </CardTitle>
                    <CardDescription className="text-purple-700 dark:text-purple-300">
                      Comprehensive analysis of your Mars mission optimization
                      results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg">
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                          {summary.objective_value.toFixed(1)}
                        </div>
                        <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          Objective Score
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          Optimization Points
                        </div>
                      </div>

                      <div className="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {summary.total_processed_kg.toFixed(1)}kg
                        </div>
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Total Processed
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Raw Materials
                        </div>
                      </div>

                      <div className="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg">
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {summary.total_output_produced_kg.toFixed(1)}kg
                        </div>
                        <div className="text-sm font-medium text-green-800 dark:text-green-200">
                          Output Produced
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Finished Products
                        </div>
                      </div>

                      <div className="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg">
                        <div className="text-4xl font-bold text-orange-600 mb-2">
                          {summary.total_carried_weight_loss.toFixed(1)}kg
                        </div>
                        <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          Weight Saved
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Mass Reduction
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MdAnalytics className="w-5 h-5" />
                      Optimization Insights
                    </CardTitle>
                    <CardDescription>
                      AI-powered analysis of your optimization performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getObjectiveFunctionInsights().map((insight, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            insight.type === "excellent"
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : insight.type === "good"
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{insight.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">
                                {insight.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {insight.description}
                              </p>
                            </div>
                            <div className="text-lg font-bold">
                              {insight.value.toFixed(1)}
                              {insight.title.includes("Efficiency") ||
                              insight.title.includes("Reduction")
                                ? "%"
                                : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Enhanced Objective Function Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MdShowChart className="w-5 h-5" />
                        Performance Metrics
                      </CardTitle>
                      <CardDescription>
                        Key efficiency indicators and optimization results
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="20%"
                          outerRadius="80%"
                          data={getObjectiveMetricsData()}
                        >
                          <RadialBar
                            dataKey="value"
                            cornerRadius={10}
                            fill="#8884d8"
                          />
                          <Tooltip
                            formatter={(value, name, props) => [
                              `${Number(value).toFixed(1)}${
                                props.payload.unit || ""
                              }`,
                              props.payload.description || name,
                            ]}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {getObjectiveMetricsData().map((metric, index) => (
                          <div
                            key={index}
                            className="text-center p-3 bg-muted/50 rounded-lg"
                          >
                            <div
                              className="text-2xl font-bold"
                              style={{ color: metric.color }}
                            >
                              {metric.value.toFixed(1)}
                              {metric.unit}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {metric.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {metric.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mass Reduction Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MdPieChart className="w-5 h-5" />
                        Mass Reduction Analysis
                      </CardTitle>
                      <CardDescription>
                        Weight reduction achieved through optimization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getWeightReductionData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getWeightReductionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value}kg`, "Weight"]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Total Weight Saved:
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {summary.total_carried_weight_loss.toFixed(1)}kg
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium">
                            Reduction Percentage:
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {(
                              (summary.total_carried_weight_loss /
                                summary.total_initial_carriage_weight) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Weekly Utilization Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MdStackedLineChart className="w-5 h-5" />
                      Weekly Performance Trends
                    </CardTitle>
                    <CardDescription>
                      Processing efficiency and objective function contribution
                      over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={getWeeklyTrendData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value, name) => {
                            const numValue = Number(value);
                            if (name === "efficiency")
                              return [`${numValue.toFixed(1)}%`, "Efficiency"];
                            if (name === "processed")
                              return [`${numValue.toFixed(1)}kg`, "Processed"];
                            if (name === "produced")
                              return [`${numValue.toFixed(1)}kg`, "Produced"];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="processed"
                          stackId="1"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          name="Processed (kg)"
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="produced"
                          stackId="2"
                          stroke="#10b981"
                          fill="#10b981"
                          name="Produced (kg)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="efficiency"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          name="Efficiency %"
                          dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Average Weekly Efficiency:
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {getWeeklyTrendData().length > 0
                            ? (
                                getWeeklyTrendData().reduce((sum, week) => {
                                  const efficiency =
                                    week.processed > 0
                                      ? (week.produced / week.processed) * 100
                                      : 0;
                                  return sum + efficiency;
                                }, 0) / getWeeklyTrendData().length
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Method Utilization Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MdBarChart className="w-5 h-5" />
                      Method Utilization Distribution
                    </CardTitle>
                    <CardDescription>
                      Processing capacity utilization by method
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getMethodUtilizationData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="method" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value}kg`, "Processed"]}
                        />
                        <Bar dataKey="processed" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MdAnalytics className="w-5 h-5" />
                    Results Overview
                  </CardTitle>
                  <CardDescription>
                    Optimization results are being processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      <MdAccessTime className="w-12 h-12 mx-auto mb-2" />
                      <p>Summary data is not available yet</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold">
                          {schedule.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Schedule Entries
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold">
                          {outputs.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Output Records
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold">
                          {items.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Item Records
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            {summary ? (
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
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MdTrendingUp className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Summary data is not available yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      <MdAccessTime className="w-12 h-12 mx-auto mb-2" />
                      <p>Summary metrics are being calculated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
                                  {Number(item.produced_kg).toFixed(1)}kg
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Produced
                                </div>
                                <div className="text-sm font-medium mt-1">
                                  {Number(item.inventory_kg).toFixed(1)}kg
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
                            {Number(item.mass_per_unit).toFixed(2)}kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Initial Weight:
                          </span>
                          <span className="font-medium">
                            {Number(item.initial_weight).toFixed(1)}kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Final Weight:
                          </span>
                          <span className="font-medium">
                            {Number(item.final_weight).toFixed(1)}kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/20 rounded">
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Weight Saved:
                          </span>
                          <span className="font-bold text-green-800 dark:text-green-200">
                            {Number(item.total_weight_loss).toFixed(1)}kg
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
