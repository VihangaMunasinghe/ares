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

export interface RecipeByMaterialMethodRequest {
  material_id: string
  method_id: string
}

export interface RecipeOutputDetailed {
  recipe_output_id: string
  recipe_id: string
  output_id: string
  yield_ratio: number
  output_key: string
  output_name: string
  units_label: string
  value_per_kg: number
  max_output_capacity_kg?: number
  output_created_at: string
}

export interface RecipeOutputCreate {
  recipe_id: string
  output_id: string
  yield_ratio: number
}

export interface RecipeOutput {
  id: string
  recipe_id: string
  output_id: string
  yield_ratio: number
}

export interface RecipeOutputDetailed {
  recipe_output_id: string
  recipe_id: string
  output_id: string
  yield_ratio: number
  output_key: string
  output_name: string
  units_label: string
  value_per_kg: number
  max_output_capacity_kg?: number
  output_created_at: string
}

export interface Output {
  id: string
  key: string
  name: string
  units_label: string
  value_per_kg: number
  max_output_capacity_kg?: number
  created_at: string
}

export interface OutputCreate {
  key: string
  name: string
  units_label?: string
  value_per_kg?: number
  max_output_capacity_kg?: number
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

  // POST /global/recipe-by-material-method
  getByMaterialMethod: async (data: RecipeByMaterialMethodRequest): Promise<Recipe> => {
    return apiRequest<Recipe>('/global/recipe-by-material-method', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // GET /global/recipe-outputs-detailed/{recipe_id}
  getOutputsDetailed: async (recipeId: string): Promise<RecipeOutputDetailed[]> => {
    return apiRequest<RecipeOutputDetailed[]>(`/global/recipe-outputs-detailed/${recipeId}`)
  },

  // DELETE /global/recipes/{recipe_id}
  delete: async (recipeId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/global/recipes/${recipeId}`, {
      method: 'DELETE',
    })
  },
}

// Outputs API
export const outputsApi = {
  // GET /global/outputs
  list: async (): Promise<Output[]> => {
    return apiRequest<Output[]>('/global/outputs')
  },

  // POST /global/outputs
  create: async (data: OutputCreate): Promise<Output> => {
    return apiRequest<Output>('/global/outputs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // DELETE /global/outputs/{output_id}
  delete: async (outputId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/global/outputs/${outputId}`, {
      method: 'DELETE',
    })
  },
}

// Recipe Outputs API
export const recipeOutputsApi = {
  // GET /global/recipe-outputs/{recipe_id}
  list: async (recipeId: string): Promise<RecipeOutput[]> => {
    return apiRequest<RecipeOutput[]>(`/global/recipe-outputs/${recipeId}`)
  },

  // POST /global/recipe-outputs
  create: async (data: RecipeOutputCreate): Promise<RecipeOutput> => {
    return apiRequest<RecipeOutput>('/global/recipe-outputs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // DELETE /global/recipe-outputs/{recipe_output_id}
  delete: async (recipeOutputId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/global/recipe-outputs/${recipeOutputId}`, {
      method: 'DELETE',
    })
  },
}

// Global entity interfaces
export interface MaterialGlobal {
  id: string;
  key: string;
  name: string;
  category: string;
  default_mass_per_unit: number;
  max_input_capacity_kg: number | null;
  tags: string[];
  safety_flags: Record<string, any>;
  created_at: string;
}

export interface MethodGlobal {
  id: string;
  key: string;
  name: string;
  category: string;
  crew_cost: number;
  energy_cost: number;
  risk_cost: number;
  availability_default: boolean;
  tags: string[];
  created_at: string;
}

export interface OutputGlobal {
  id: string;
  key: string;
  name: string;
  category: string;
  default_mass_per_unit: number;
  tags: string[];
  created_at: string;
}

export interface ItemGlobal {
  id: string;
  key: string;
  name: string;
  category: string;
  default_mass_per_unit: number;
  default_value_per_unit: number;
  tags: string[];
  created_at: string;
}

export interface SubstituteGlobal {
  id: string;
  key: string;
  name: string;
  value_per_unit: number;
  lifetime_weeks: number;
  created_at: string;
}

export interface SubstituteGlobalCreate {
  key: string;
  name: string;
  value_per_unit?: number;
  lifetime_weeks?: number;
}

// Items catalog interface (joined data from backend)
export interface ItemsCatalog {
  id: string;
  name: string;
  category: string;
  unit: string;
  mass_per_unit: number | null;
  composition: string;
  waste_mappings: number;
  safety: Record<string, any>;
  created_at: string;
}

export interface ItemGlobalCreate {
  key: string;
  name: string;
  units_label?: string;
  mass_per_unit?: number;
  lifetime_weeks?: number;
}

export interface ItemWasteCreate {
  item_id: string;
  material_id: string;
  waste_per_unit: number;
}

// API functions for global entities
export const globalEntitiesApi = {
  // Materials
  async getMaterials(): Promise<MaterialGlobal[]> {
    return apiRequest<MaterialGlobal[]>("/global/materials");
  },

  // Methods
  async getMethods(): Promise<MethodGlobal[]> {
    return apiRequest<MethodGlobal[]>("/global/methods");
  },

  // Outputs
  async getOutputs(): Promise<OutputGlobal[]> {
    return apiRequest<OutputGlobal[]>("/global/outputs");
  },

  // Items
  async getItems(): Promise<ItemGlobal[]> {
    return apiRequest<ItemGlobal[]>("/global/items");
  },

  // Substitutes
  async getSubstitutes(): Promise<SubstituteGlobal[]> {
    return apiRequest<SubstituteGlobal[]>("/global/substitutes");
  },

  async createSubstitute(data: SubstituteGlobalCreate): Promise<SubstituteGlobal> {
    return apiRequest<SubstituteGlobal>("/global/substitutes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteSubstitute(substituteId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/global/substitutes/${substituteId}`, {
      method: "DELETE",
    });
  },

  // Items Catalog (joined data)
  async getItemsCatalog(): Promise<ItemsCatalog[]> {
    return apiRequest<ItemsCatalog[]>("/global/items-catalog");
  },

  // Items CRUD
  async createItem(data: ItemGlobalCreate): Promise<ItemGlobal> {
    return apiRequest<ItemGlobal>("/global/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteItem(itemId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/global/items/${itemId}`, {
      method: "DELETE",
    });
  },

  async updateItem(itemId: string, data: ItemGlobalCreate): Promise<ItemGlobal> {
    return apiRequest<ItemGlobal>(`/global/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Item waste relationships
  async createItemWaste(data: ItemWasteCreate): Promise<any> {
    return apiRequest<any>("/global/item-waste", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteItemWaste(itemWasteId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/global/item-waste/${itemWasteId}`, {
      method: "DELETE",
    });
  },
};
