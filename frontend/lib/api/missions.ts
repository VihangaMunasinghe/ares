import { apiRequest } from './client'

export interface Mission {
  id: string
  name: string
  description?: string | null
  mission_start_date?: string | null
  duration_weeks: number
  transit_weeks: number
  surface_weeks: number
  return_weeks: number
  crew_count: number
  crew_hours_per_week: number
  printer_capacity_kg_per_week: number
  tools_available: string[]
  status: "Planned" | "Running" | "Completed" | "Archived"
  owner_id?: string | null
}

export interface MissionCreate {
  name: string
  description?: string | null
  mission_start_date?: string | null
  duration_weeks: number
  transit_weeks: number
  surface_weeks: number
  return_weeks: number
  crew_count: number
  crew_hours_per_week: number
  printer_capacity_kg_per_week: number
  tools_available: string[]
  status?: "Planned" | "Running" | "Completed" | "Archived"
}

// API functions for missions
export const missionsApi = {
  // Get all missions
  async getMissions(): Promise<Mission[]> {
    return apiRequest<Mission[]>('/missions')
  },

  // Get single mission by ID
  async getMission(id: string): Promise<Mission> {
    return apiRequest<Mission>(`/missions/${id}`)
  },

  // Create new mission
  async createMission(mission: MissionCreate): Promise<Mission> {
    return apiRequest<Mission>('/missions', {
      method: 'POST',
      body: JSON.stringify(mission),
    })
  },

  // Delete mission
  async deleteMission(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/missions/${id}`, {
      method: 'DELETE',
    })
  },
}