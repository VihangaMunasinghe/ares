export interface Job {
  id: string
  name: string
  type: "optimization" | "scheduling" | "analysis" | "simulation"
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress: number
  missionId?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  result?: JobResult
  error?: string
}

export interface JobResult {
  success: boolean
  data: Record<string, unknown>
  metrics: {
    duration: number
    itemsProcessed: number
    optimizationScore?: number
  }
}

export interface ScheduleJob {
  id: string
  taskName: string
  assignedTo: string
  startTime: string
  endTime: string
  duration: number
  dependencies: string[]
  resources: string[]
  status: "scheduled" | "in-progress" | "completed" | "blocked"
}
