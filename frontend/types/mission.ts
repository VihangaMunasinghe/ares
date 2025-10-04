export type Mission = {
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
    mission_start_date: null,
    duration_weeks: 52,
    transit_weeks: 12,
    surface_weeks: 28,
    return_weeks: 12,
    crew_count: 6,
    crew_hours_per_week: 40,
    printer_capacity_kg_per_week: 5.0,
    tools_available: ["extruder", "3d-printer", "press", "grinder"],
    status: "Planned",
    owner_id: "11111111-2222-3333-4444-555555555555",
  },
  {
    id: "2",
    name: "Olympus Base",
    description: "Establish permanent research station near Olympus Mons",
    mission_start_date: null,
    duration_weeks: 78,
    transit_weeks: 14,
    surface_weeks: 50,
    return_weeks: 14,
    crew_count: 8,
    crew_hours_per_week: 45,
    printer_capacity_kg_per_week: 7.5,
    tools_available: ["extruder", "3d-printer", "press", "grinder", "welder", "cnc-mill"],
    status: "Running",
    owner_id: "11111111-2222-3333-4444-555555555555",
  },
  {
    id: "3",
    name: "Valles Marineris Survey",
    description: "Geological survey and sample collection mission",
    mission_start_date: null,
    duration_weeks: 40,
    transit_weeks: 10,
    surface_weeks: 20,
    return_weeks: 10,
    crew_count: 4,
    crew_hours_per_week: 35,
    printer_capacity_kg_per_week: 3.0,
    tools_available: ["3d-printer", "grinder", "laser-cutter"],
    status: "Completed",
    owner_id: "11111111-2222-3333-4444-555555555555",
  },
]
