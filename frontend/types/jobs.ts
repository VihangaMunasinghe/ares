export interface Job {
  id: string;
  name: string;
  type: "optimization" | "scheduling" | "analysis" | "simulation";
  status: "draft" | "entities_config" | "inventory_config" | "demands_config" | "resources_config" | "ready" | "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  missionId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  result?: JobResult;
  error?: string;
}

export interface MaterialQuantityDiff {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  before: number;
  after: number;
  change: number;
  changeType: "reduced" | "increased" | "eliminated" | "added";
  justification: string;
  impactType:
    | "mass_saving"
    | "recycling_gain"
    | "safety_improvement"
    | "efficiency_gain";
  weekApplied?: number[];
}

export interface OptimizationDiff {
  materialChanges: MaterialQuantityDiff[];
  summary: {
    totalMassSaved: number;
    totalItemsAffected: number;
    recyclingTasksAdded: number;
    safetyImprovements: number;
  };
  justification: {
    primaryStrategy: string;
    keyDecisions: string[];
    tradeOffs: string[];
  };
}

export interface JobResult {
  success: boolean;
  data: Record<string, unknown> & {
    optimizedSchedule?: {
      totalWasteReduced?: string;
      energyEfficiency?: string;
      crewUtilization?: string;
    };
    optimizationDiff?: OptimizationDiff;
  };
  metrics: {
    duration: number;
    itemsProcessed: number;
    optimizationScore?: number;
  };
}

export interface ScheduleJob {
  id: string;
  taskName: string;
  assignedTo: string;
  startTime: string;
  endTime: string;
  duration: number;
  dependencies: string[];
  resources: string[];
  status: "scheduled" | "in-progress" | "completed" | "blocked";
}
