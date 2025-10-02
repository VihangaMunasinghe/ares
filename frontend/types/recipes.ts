export interface Recipe {
  id: string
  name: string
  description: string
  category: string
  ingredients: Ingredient[]
  steps: string[]
  prepTime: number
  cookTime: number
  servings: number
  nutritionalInfo?: NutritionalInfo
  createdAt: string
  updatedAt: string
}

export interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  notes?: string
}

export interface NutritionalInfo {
  calories: number
  protein: number
  carbohydrates: number
  fat: number
  fiber: number
}
