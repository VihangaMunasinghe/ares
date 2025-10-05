import { apiRequest } from "./client";

// Job status type matching backend
export type JobStatus =
  | "draft" // Step 1: Job created, basic details saved
  | "entities_config" // Step 2: Entities selected and enabled
  | "inventory_config" // Step 3: Inventories configured
  | "demands_config" // Step 4: Demands and deadlines configured
  | "resources_config" // Step 5: Resources and capacity configured
  | "ready" // Step 6: Ready to run
  | "pending" // Queued for execution
  | "running" // Currently executing
  | "completed" // Successfully completed
  | "failed" // Failed during execution
  | "cancelled"; // Cancelled by user

// Backend job interface (matching JobOut model)
export interface BackendJob {
  id: string;
  mission_id: string;
  created_by: string | null;
  status: JobStatus;
  total_weeks: number;
  w_mass: number;
  w_value: number;
  w_crew: number;
  w_energy: number;
  w_risk: number;
  w_make: number;
  w_carry: number;
  w_shortage: number;
  params: Record<string, any>;
  result_summary: Record<string, any> | null;
  result_bundle: Record<string, any> | null;
  solver_status: Record<string, any> | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend job interface (matching existing Job type)
export interface Job {
  id: string;
  missionId: string;
  name: string;
  type: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: {
    success: boolean;
    metrics: {
      optimizationScore: number;
      duration: number;
      itemsProcessed: number;
    };
  };
}

// Calculate optimization score based on multiple factors
function calculateOptimizationScore({
  objectiveValue,
  totalProcessed,
  totalOutput,
  weightLoss,
  totalWeeks,
}: {
  objectiveValue: number;
  totalProcessed: number;
  totalOutput: number;
  weightLoss: number;
  totalWeeks: number;
}): number {
  // Base score from objective value (normalized)
  let score = 0;

  // Factor 1: Objective value contribution (40% weight)
  // Normalize objective value based on mission scale
  const missionScale = totalWeeks * 10; // Expected scale factor
  const normalizedObjective = Math.max(0, objectiveValue / missionScale);
  const objectiveScore = Math.min(10, normalizedObjective * 4); // Scale to 0-4

  // Factor 2: Processing efficiency (30% weight)
  const efficiency = totalProcessed > 0 ? totalOutput / totalProcessed : 0;
  const efficiencyScore = Math.min(3, efficiency * 3); // Scale to 0-3

  // Factor 3: Weight reduction achievement (20% weight)
  const weightReductionScore = Math.min(2, weightLoss / 10); // Scale to 0-2

  // Factor 4: Mission completion bonus (10% weight)
  const completionBonus = totalProcessed > 0 ? 1 : 0; // 0-1

  score =
    objectiveScore + efficiencyScore + weightReductionScore + completionBonus;

  // Ensure score is between 0 and 10
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

// Transform backend job to frontend job format
function transformJob(backendJob: BackendJob): Job {
  // Generate a readable name based on job parameters or use a default
  const name = `Optimization Job ${backendJob.id.slice(0, 8)}`;

  // Determine job type based on parameters or use default
  const type = "optimization";

  // Calculate progress (mock for now, could be enhanced)
  let progress = 0;
  if (backendJob.status === "running") {
    progress = 50; // Mock progress for running jobs
  } else if (backendJob.status === "completed") {
    progress = 100;
  }

  // Transform result if available
  let result = undefined;
  if (backendJob.status === "completed" && backendJob.result_summary) {
    const objectiveValue = backendJob.result_summary.objective_value || 0;
    const totalProcessed = backendJob.result_summary.total_processed_kg || 0;
    const totalOutput = backendJob.result_summary.total_output_produced_kg || 0;
    const weightLoss = backendJob.result_summary.total_carried_weight_loss || 0;

    // Calculate a more meaningful optimization score
    const optimizationScore = calculateOptimizationScore({
      objectiveValue,
      totalProcessed,
      totalOutput,
      weightLoss,
      totalWeeks: backendJob.total_weeks,
    });

    result = {
      success: true,
      metrics: {
        optimizationScore,
        duration: Math.round(
          (Date.parse(backendJob.completed_at || backendJob.created_at) -
            Date.parse(backendJob.started_at || backendJob.created_at)) /
            (1000 * 60)
        ), // Duration in minutes
        itemsProcessed: Math.round(totalProcessed),
      },
    };
  }

  return {
    id: backendJob.id,
    missionId: backendJob.mission_id,
    name,
    type,
    status: backendJob.status,
    progress,
    createdAt: backendJob.created_at,
    startedAt: backendJob.started_at || undefined,
    completedAt: backendJob.completed_at || undefined,
    error: backendJob.error_message || undefined,
    result,
  };
}

// Job creation interface (matching backend JobCreate)
export interface JobCreateRequest {
  mission_id: string;
  total_weeks: number;
  w_mass?: number;
  w_value?: number;
  w_crew?: number;
  w_energy?: number;
  w_risk?: number;
  w_make?: number;
  w_carry?: number;
  w_shortage?: number;
  params?: Record<string, any>;
}

// Job configuration interfaces
export interface JobInventoryItem {
  id: string;
  qty_kg?: number;
  qty_units?: number;
}

export interface JobDemandItem {
  item_id: string;
  week: number;
  amount: number;
}

export interface JobDeadlineItem {
  item_id: string;
  week: number;
  amount: number;
}

export interface JobWeekResource {
  week: number;
  crew_available: number;
  energy_available: number;
}

export interface JobMethodCapacity {
  method_id: string;
  week: number;
  max_capacity_kg: number;
  available: boolean;
}

// API functions for jobs
export const jobsApi = {
  // Get all jobs for a mission
  async getJobsByMission(missionId: string): Promise<Job[]> {
    const backendJobs = await apiRequest<BackendJob[]>(
      `/jobs/by-mission/${missionId}`
    );
    return backendJobs.map(transformJob);
  },

  // Get single job by ID
  async getJob(jobId: string): Promise<Job> {
    const backendJob = await apiRequest<BackendJob>(`/jobs/${jobId}`);
    return transformJob(backendJob);
  },

  // Get enhanced job metrics
  async getJobMetrics(jobId: string): Promise<any> {
    return apiRequest<any>(`/jobs/${jobId}/metrics`);
  },

  // Debug job data
  async debugJobData(jobId: string): Promise<any> {
    return apiRequest<any>(`/jobs/${jobId}/debug`);
  },

  // Create a new job
  async createJob(jobData: JobCreateRequest): Promise<Job> {
    const backendJob = await apiRequest<BackendJob>(`/jobs`, {
      method: "POST",
      body: JSON.stringify(jobData),
    });
    return transformJob(backendJob);
  },

  // Run a job
  async runJob(
    jobId: string
  ): Promise<{ success: boolean; message: string; job_id: string }> {
    return apiRequest<{ success: boolean; message: string; job_id: string }>(
      `/jobs/${jobId}/run`,
      {
        method: "POST",
      }
    );
  },

  // Delete job
  async deleteJob(
    jobId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/jobs/${jobId}`, {
      method: "DELETE",
    });
  },

  // Update job status
  async updateJobStatus(
    jobId: string,
    status: JobStatus
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/jobs/${jobId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Get job configuration for wizard
  async getJobConfiguration(jobId: string): Promise<{
    job: BackendJob;
    selectedMaterials: string[];
    selectedMethods: string[];
    selectedOutputs: string[];
    selectedItems: string[];
    selectedSubstitutes: string[];
    materialInventories: Record<string, number>;
    outputInventories: Record<string, number>;
    itemInventories: Record<string, number>;
    substituteInventories: Record<string, number>;
    itemDemands: Array<{ itemId: string; week: number; amount: number }>;
    itemDeadlines: Array<{ itemId: string; week: number; amount: number }>;
    weeklyResources: Array<{
      week: number;
      crewAvailable: number;
      energyAvailable: number;
    }>;
    methodCapacities: Array<{
      methodId: string;
      week: number;
      maxCapacityKg: number;
      available: boolean;
    }>;
  }> {
    return apiRequest<any>(`/jobs/${jobId}/configuration`);
  },

  // Job configuration methods
  async enableMaterials(
    jobId: string,
    materialIds: string[]
  ): Promise<{ success: boolean; enabled_materials: number }> {
    return apiRequest<{ success: boolean; enabled_materials: number }>(
      `/jobs/${jobId}/enable/materials`,
      {
        method: "POST",
        body: JSON.stringify(materialIds),
      }
    );
  },

  async enableMethods(
    jobId: string,
    methodIds: string[]
  ): Promise<{ success: boolean; enabled_methods: number }> {
    return apiRequest<{ success: boolean; enabled_methods: number }>(
      `/jobs/${jobId}/enable/methods`,
      {
        method: "POST",
        body: JSON.stringify(methodIds),
      }
    );
  },

  async enableOutputs(
    jobId: string,
    outputIds: string[]
  ): Promise<{ success: boolean; enabled_outputs: number }> {
    return apiRequest<{ success: boolean; enabled_outputs: number }>(
      `/jobs/${jobId}/enable/outputs`,
      {
        method: "POST",
        body: JSON.stringify(outputIds),
      }
    );
  },

  async enableItems(
    jobId: string,
    itemIds: string[]
  ): Promise<{ success: boolean; enabled_items: number }> {
    return apiRequest<{ success: boolean; enabled_items: number }>(
      `/jobs/${jobId}/enable/items`,
      {
        method: "POST",
        body: JSON.stringify(itemIds),
      }
    );
  },

  async enableSubstitutes(
    jobId: string,
    substituteIds: string[]
  ): Promise<{ success: boolean; enabled_substitutes: number }> {
    return apiRequest<{ success: boolean; enabled_substitutes: number }>(
      `/jobs/${jobId}/enable/substitutes`,
      {
        method: "POST",
        body: JSON.stringify(substituteIds),
      }
    );
  },

  // Inventory management
  async setMaterialInventory(
    jobId: string,
    materialId: string,
    qtyKg: number
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      `/jobs/${jobId}/inventory/materials`,
      {
        method: "POST",
        body: JSON.stringify({
          job_id: jobId,
          material_id: materialId,
          qty_kg: qtyKg,
        }),
      }
    );
  },

  async setOutputInventory(
    jobId: string,
    outputId: string,
    qtyKg: number
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      `/jobs/${jobId}/inventory/outputs`,
      {
        method: "POST",
        body: JSON.stringify({
          job_id: jobId,
          output_id: outputId,
          qty_kg: qtyKg,
        }),
      }
    );
  },

  async setItemInventory(
    jobId: string,
    itemId: string,
    qtyUnits: number
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/jobs/${jobId}/inventory/items`, {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        item_id: itemId,
        qty_units: qtyUnits,
      }),
    });
  },

  async setSubstituteInventory(
    jobId: string,
    substituteId: string,
    qtyUnits: number
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      `/jobs/${jobId}/inventory/substitutes`,
      {
        method: "POST",
        body: JSON.stringify({
          job_id: jobId,
          substitute_id: substituteId,
          qty_units: qtyUnits,
        }),
      }
    );
  },

  // Demands and deadlines
  async setItemDemand(
    jobId: string,
    itemId: string,
    week: number,
    amount: number
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/jobs/${jobId}/demands`, {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, item_id: itemId, week, amount }),
    });
  },

  async setDeadline(
    jobId: string,
    itemId: string,
    week: number,
    amount: number
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/jobs/${jobId}/deadlines`, {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, item_id: itemId, week, amount }),
    });
  },

  // Resources and capacity
  async setWeekResources(
    jobId: string,
    week: number,
    crewAvailable: number,
    energyAvailable: number
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/jobs/${jobId}/resources`, {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        week,
        crew_available: crewAvailable,
        energy_available: energyAvailable,
      }),
    });
  },

  async setMethodCapacity(
    jobId: string,
    methodId: string,
    week: number,
    maxCapacityKg: number,
    available: boolean
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/jobs/${jobId}/method-capacity`, {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        method_id: methodId,
        week,
        max_capacity_kg: maxCapacityKg,
        available,
      }),
    });
  },

  // Job Results API methods
  async getJobResultSummary(jobId: string): Promise<any> {
    try {
      return await apiRequest<any>(`/jobs/${jobId}/results/summary`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`No summary data found for job ${jobId}`);
        return null;
      }
      throw error;
    }
  },

  async getJobResultSchedule(jobId: string): Promise<any[]> {
    try {
      return await apiRequest<any[]>(`/jobs/${jobId}/results/schedule`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`No schedule data found for job ${jobId}`);
        return [];
      }
      throw error;
    }
  },

  async getJobResultOutputs(jobId: string): Promise<any[]> {
    try {
      return await apiRequest<any[]>(`/jobs/${jobId}/results/outputs`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`No outputs data found for job ${jobId}`);
        return [];
      }
      throw error;
    }
  },

  async getJobResultSubstitutes(jobId: string): Promise<any[]> {
    try {
      return await apiRequest<any[]>(`/jobs/${jobId}/results/substitutes`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`No substitutes data found for job ${jobId}`);
        return [];
      }
      throw error;
    }
  },

  async getJobResultSubstituteBreakdown(jobId: string): Promise<any[]> {
    try {
      return await apiRequest<any[]>(
        `/jobs/${jobId}/results/substitute-breakdown`
      );
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`No substitute breakdown data found for job ${jobId}`);
        return [];
      }
      throw error;
    }
  },

  async getJobResultItems(jobId: string): Promise<any[]> {
    try {
      return await apiRequest<any[]>(`/jobs/${jobId}/results/items`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`No items data found for job ${jobId}`);
        return [];
      }
      throw error;
    }
  },

  async getJobResultWeightLoss(jobId: string): Promise<any[]> {
    try {
      return await apiRequest<any[]>(`/jobs/${jobId}/results/weight-loss`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`No weight loss data found for job ${jobId}`);
        return [];
      }
      throw error;
    }
  },
};
