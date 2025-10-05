import { apiRequest } from "./client";

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
  category: string;
  default_mass_per_unit: number;
  default_value_per_unit: number;
  tags: string[];
  created_at: string;
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
};
