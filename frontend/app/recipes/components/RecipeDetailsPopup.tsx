"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MdAccessTime, MdBolt, MdWarning, MdInventory, MdDelete, MdDeleteForever } from "react-icons/md"
import { recipesApi, recipeOutputsApi } from "@/lib/api/global-entities"
import type { Recipe as ApiRecipe, RecipeOutputDetailed, Material as ApiMaterial, Method as ApiMethod } from "@/lib/api/global-entities"

interface RecipeDetailsPopupProps {
  isOpen: boolean
  onClose: () => void
  onRecipeDeleted?: () => void
  materialId?: string
  methodId?: string
  materials: ApiMaterial[]
  methods: ApiMethod[]
}

export function RecipeDetailsPopup({ 
  isOpen, 
  onClose, 
  onRecipeDeleted,
  materialId, 
  methodId, 
  materials, 
  methods 
}: RecipeDetailsPopupProps) {
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null)
  const [outputs, setOutputs] = useState<RecipeOutputDetailed[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const material = materials.find(m => m.id === materialId)
  const method = methods.find(m => m.id === methodId)

  useEffect(() => {
    if (isOpen && materialId && methodId) {
      loadRecipeData()
    }
  }, [isOpen, materialId, methodId])

  const loadRecipeData = async () => {
    if (!materialId || !methodId) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Get recipe by material and method
      const recipeData = await recipesApi.getByMaterialMethod({
        material_id: materialId,
        method_id: methodId,
      })
      setRecipe(recipeData)

      // Get detailed outputs for the recipe
      const outputsData = await recipesApi.getOutputsDetailed(recipeData.id)
      setOutputs(outputsData)
    } catch (err) {
      console.error("Error loading recipe data:", err)
      setError("Recipe not found for this material and method combination")
      setRecipe(null)
      setOutputs([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatCost = (value: number) => {
    return value.toFixed(2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDeleteRecipe = async () => {
    if (!recipe) return

    setIsDeleting(true)
    try {
      await recipesApi.delete(recipe.id)
      onRecipeDeleted?.()
      onClose()
    } catch (error) {
      console.error("Error deleting recipe:", error)
      alert("Failed to delete recipe. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteOutput = async (recipeOutputId: string) => {
    try {
      await recipeOutputsApi.delete(recipeOutputId)
      // Reload outputs
      if (recipe) {
        const updatedOutputs = await recipesApi.getOutputsDetailed(recipe.id)
        setOutputs(updatedOutputs)
      }
    } catch (error) {
      console.error("Error deleting recipe output:", error)
      alert("Failed to delete recipe output. Please try again.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Recipe Details</DialogTitle>
              <DialogDescription className="text-base">
                {material?.name} + {method?.name}
              </DialogDescription>
            </div>
            {recipe && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <MdDelete className="w-4 h-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the recipe for "{material?.name}" using "{method?.name}".
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteRecipe}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Recipe"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <MdWarning className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : recipe ? (
          <div className="space-y-6">
            {/* Cost Information */}
            <div>
              <h3 className="font-semibold mb-3">Cost Breakdown</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg border">
                  <MdAccessTime className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Crew Cost</p>
                  <p className="font-bold text-blue-700">${formatCost(recipe.crew_cost_per_kg)}/kg</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border">
                  <MdBolt className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Energy</p>
                  <p className="font-bold text-yellow-700">{formatCost(recipe.energy_cost_kwh_per_kg)} kWh/kg</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border">
                  <MdWarning className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Risk Cost</p>
                  <p className="font-bold text-red-700">${formatCost(recipe.risk_cost)}</p>
                </div>
              </div>
            </div>

            {/* Output Products */}
            <div>
              <h3 className="font-semibold mb-3">Output Products ({outputs.length})</h3>
              {outputs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <MdInventory className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No outputs defined</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outputs.map((output) => (
                    <div key={output.recipe_output_id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50">
                      <div className="flex-1">
                        <p className="font-medium">{output.output_name}</p>
                        <p className="text-sm text-muted-foreground">{output.units_label} • ${output.value_per_kg}/kg</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {(output.yield_ratio * 100).toFixed(1)}%
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                              <MdDeleteForever className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Output?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove "{output.output_name}" from this recipe?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteOutput(output.recipe_output_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recipe Info */}
            <div className="text-sm text-muted-foreground border-t pt-3">
              <p><strong>Created:</strong> {formatDate(recipe.created_at)}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}