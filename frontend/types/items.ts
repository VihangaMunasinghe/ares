export interface PlannedItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  missionId: string
  recipeId?: string
  priority: "low" | "medium" | "high"
  status: "planned" | "ordered" | "received" | "deployed"
  estimatedCost: number
  weight: number
  volume: number
  createdAt: string
  updatedAt: string
}

export interface ItemCategory {
  id: string
  name: string
  description: string
  color: string
}

export interface ItemTemplate {
  id: string
  name: string
  category: string
  manufacturer?: string
  sku?: string
  unit: string
  mass_per_unit_kg: number
  volume_per_unit_l?: number
  default_pack_quantity?: number
  composition: Array<{
    material_id: string
    material_name: string
    percent_by_mass: number
    recoverable?: boolean
  }>
  waste_mappings: Array<{
    material_id: string
    waste_id: string
    waste_name: string
    recommended_methods: Array<{
      recipe_id: string
      method_name: string
      expected_yield?: number
      feasibility_override?: number
      notes?: string
    }>
  }>
  default_usage_hint?: string
  safety_flags?: {
    flammability?: "low" | "medium" | "high"
    toxicity?: "none" | "low" | "medium" | "high"
    bio?: boolean
    dust_hazard?: boolean
  }
  tags?: string[]
  deprecated?: boolean
  versions?: Array<{ version_id: string; created_at: string; note?: string }>
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  name: string
  category: string
}

export interface WasteStream {
  id: string
  name: string
  material_id: string
}
