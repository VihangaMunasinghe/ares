export interface Mission {
  id: string
  name: string
  description: string
  status: "planning" | "active" | "completed" | "cancelled"
  startDate: string
  endDate?: string
  crew: number
  duration: number
  createdAt: string
  updatedAt: string
}

export interface MissionObjective {
  id: string
  missionId: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  completed: boolean
}
