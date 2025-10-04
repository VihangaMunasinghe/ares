import type { Job } from "@/types/jobs"

export const mockOptimizationJobs: Job[] = [
  {
    id: "opt-001",
    name: "Resource Allocation Optimization",
    type: "optimization",
    status: "completed",
    progress: 100,
    missionId: "1",
    startedAt: "2025-01-20T10:00:00Z",
    completedAt: "2025-01-20T11:30:00Z",
    createdAt: "2025-01-20T09:45:00Z",
    result: {
      success: true,
      data: {
        optimizedSchedule: {
          totalWasteReduced: "85%",
          energyEfficiency: "92%",
          crewUtilization: "78%"
        }
      },
      metrics: {
        duration: 90,
        itemsProcessed: 156,
        optimizationScore: 8.7
      }
    }
  },
  {
    id: "opt-002", 
    name: "Waste Processing Optimization",
    type: "optimization",
    status: "running",
    progress: 65,
    missionId: "1",
    startedAt: "2025-01-21T14:15:00Z",
    createdAt: "2025-01-21T14:00:00Z",
    result: undefined
  },
  {
    id: "opt-003",
    name: "Crew Schedule Optimization", 
    type: "optimization",
    status: "failed",
    progress: 25,
    missionId: "1",
    startedAt: "2025-01-19T16:00:00Z",
    completedAt: "2025-01-19T16:45:00Z",
    createdAt: "2025-01-19T15:30:00Z",
    error: "Insufficient crew availability data for optimization",
    result: {
      success: false,
      data: {},
      metrics: {
        duration: 45,
        itemsProcessed: 23,
        optimizationScore: 0
      }
    }
  },
  {
    id: "opt-004",
    name: "Mission Phase Optimization",
    type: "optimization", 
    status: "pending",
    progress: 0,
    missionId: "1",
    createdAt: "2025-01-22T08:00:00Z"
  }
]

export const mockOptimizationJobsForMission2: Job[] = [
  {
    id: "opt-005",
    name: "Long-term Resource Planning",
    type: "optimization",
    status: "completed",
    progress: 100,
    missionId: "2",
    startedAt: "2025-02-01T09:00:00Z",
    completedAt: "2025-02-01T12:00:00Z",
    createdAt: "2025-02-01T08:30:00Z",
    result: {
      success: true,
      data: {
        optimizedSchedule: {
          totalWasteReduced: "91%",
          energyEfficiency: "88%",
          crewUtilization: "82%"
        }
      },
      metrics: {
        duration: 180,
        itemsProcessed: 298,
        optimizationScore: 9.2
      }
    }
  }
]
