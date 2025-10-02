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
}

export interface RecipeGridData {
  materials: Material[]
  methods: Method[]
  recipes: Recipe[]
}
