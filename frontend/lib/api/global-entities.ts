import { apiRequest } from './client'

// Types based on backend models
export interface Material {
  id: string
  key: string
  name: string
  category: string
  default_mass_per_unit?: number
  max_input_capacity_kg?: number
  tags: string[]
  safety_flags: Record<string, any>
  created_by?: string
  created_at: string
}

export interface MaterialCreate {
  key: string
  name: string
  category?: string
  default_mass_per_unit?: number
  max_input_capacity_kg?: number
  tags?: string[]
  safety_flags?: Record<string, any>
}

export interface Method {
  id: string
  key: string
  name: string
  description?: string
  min_lot_size: number
  tools_required: string[]
  availability_default: boolean
  created_at: string
}

export interface MethodCreate {
  key: string
  name: string
  description?: string
  min_lot_size?: number
  tools_required?: string[]
  availability_default?: boolean
}

export interface Recipe {
  id: string
  material_id: string
  method_id: string
  crew_cost_per_kg: number
  energy_cost_kwh_per_kg: number
  risk_cost: number
  created_at: string
}

export interface RecipeCreate {
  material_id: string
  method_id: string
  crew_cost_per_kg?: number
  energy_cost_kwh_per_kg?: number
  risk_cost?: number
}

// Materials API
export const materialsApi = {
  // GET /global/materials
  list: async (): Promise<Material[]> => {
    return apiRequest<Material[]>('/global/materials')
  },

  // POST /global/materials
  create: async (data: MaterialCreate): Promise<Material> => {
    return apiRequest<Material>('/global/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // DELETE /global/materials/{material_id}
  delete: async (materialId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/global/materials/${materialId}`, {
      method: 'DELETE',
    })
  },
}

// Methods API
export const methodsApi = {
  // GET /global/methods
  list: async (): Promise<Method[]> => {
    return apiRequest<Method[]>('/global/methods')
  },

  // POST /global/methods
  create: async (data: MethodCreate): Promise<Method> => {
    return apiRequest<Method>('/global/methods', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // DELETE /global/methods/{method_id}
  delete: async (methodId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/global/methods/${methodId}`, {
      method: 'DELETE',
    })
  },
}

// Recipes API
export const recipesApi = {
  // GET /global/recipes
  list: async (): Promise<Recipe[]> => {
    return apiRequest<Recipe[]>('/global/recipes')
  },

  // POST /global/recipes
  create: async (data: RecipeCreate): Promise<Recipe> => {
    return apiRequest<Recipe>('/global/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // DELETE /global/recipes/{recipe_id}
  delete: async (recipeId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/global/recipes/${recipeId}`, {
      method: 'DELETE',
    })
  },
}
