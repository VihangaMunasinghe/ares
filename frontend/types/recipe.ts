export interface Material {
  id: string
  name: string
  category?: string
}

export interface Method {
  id: string
  name: string
  description?: string
  volumeConstraint?: number
  capacityPerDay?: number // kg/day
}

export interface RecipeScore {
  feasibilityScore: number // 0-100
  yieldPercent: number // 0-100
  crewTimeHours: number // hours/kg
  energyKwh: number // kWh/kg
}

export interface Recipe {
  id: string
  materialId: string
  methodId: string
  scores: RecipeScore
  inputs: {
    material: string
    minQuantity: number
  }[]
  outputs: {
    product: string
    yield: number
    output_name?: string
    yield_ratio?: number
    output_key?: string
    units_label?: string
    value_per_kg?: number
    max_output_capacity_kg?: number
  }[]
  constraints: {
    volumeConstraint?: number
    capacityPerDay?: number
  }
  safetyFlags: {
    flammable: boolean
    biohazard: boolean
    contaminationRisk: boolean
  }
  validationErrors?: string[]
  apiRecipe?: {
    id: string
    material_id: string
    method_id: string
    crew_cost_per_kg: number
    energy_cost_kwh_per_kg: number
    risk_cost: number
    created_at: string
  }
}

export interface RecipeGridData {
  materials: Material[]
  methods: Method[]
  recipes: Recipe[]
}
