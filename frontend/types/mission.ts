export type Mission = {
  id: string
  name: string
  description?: string
  duration_weeks: number
  transit_weeks: number
  surface_weeks: number
  return_weeks: number
  crew_count: number
  crew_hours_per_week: number
  printer_capacity_kg_per_week: number
  tools_available: string[]
  created_by: string
  created_at: string
  updated_at: string
  status: "Planned" | "Running" | "Completed"
}

export const AVAILABLE_TOOLS = [
  "Extruder",
  "3D Printer",
  "Press",
  "Grinder",
  "Lathe",
  "Welder",
  "CNC Mill",
  "Laser Cutter",
]

// Mock data for demonstration
export const mockMissions: Mission[] = [
  {
    id: "1",
    name: "Ares III",
    description: "Extended surface mission to Acidalia Planitia",
    duration_weeks: 52,
    transit_weeks: 12,
    surface_weeks: 28,
    return_weeks: 12,
    crew_count: 6,
    crew_hours_per_week: 40,
    printer_capacity_kg_per_week: 5.0,
    tools_available: ["Extruder", "3D Printer", "Press", "Grinder"],
    created_by: "Dr. Sarah Chen",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-20T14:22:00Z",
    status: "Planned",
  },
  {
    id: "2",
    name: "Olympus Base",
    description: "Establish permanent research station near Olympus Mons",
    duration_weeks: 78,
    transit_weeks: 14,
    surface_weeks: 50,
    return_weeks: 14,
    crew_count: 8,
    crew_hours_per_week: 45,
    printer_capacity_kg_per_week: 7.5,
    tools_available: ["Extruder", "3D Printer", "Press", "Grinder", "Welder", "CNC Mill"],
    created_by: "Commander James Rodriguez",
    created_at: "2025-02-01T08:15:00Z",
    updated_at: "2025-02-10T16:45:00Z",
    status: "Running",
  },
  {
    id: "3",
    name: "Valles Marineris Survey",
    description: "Geological survey and sample collection mission",
    duration_weeks: 40,
    transit_weeks: 10,
    surface_weeks: 20,
    return_weeks: 10,
    crew_count: 4,
    crew_hours_per_week: 35,
    printer_capacity_kg_per_week: 3.0,
    tools_available: ["3D Printer", "Grinder", "Laser Cutter"],
    created_by: "Dr. Emily Watson",
    created_at: "2024-11-20T12:00:00Z",
    updated_at: "2024-12-15T09:30:00Z",
    status: "Completed",
  },
]
