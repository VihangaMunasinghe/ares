"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MdDelete, MdInfo, MdAdd } from "react-icons/md"
import type { Recipe, RecipeGridData } from "@/types/recipe"

interface RecipesTableProps {
  gridData: RecipeGridData
  onCellClick: (recipe: Recipe) => void
  onDataChange: (data: RecipeGridData) => void
  onCreateRecipe?: (materialId: string, methodId: string) => void
  onDeleteRecipe?: (recipe: Recipe) => void
}

export function RecipesTable({ gridData, onCellClick, onDataChange, onCreateRecipe, onDeleteRecipe }: RecipesTableProps) {
  const getRecipe = (materialId: string, methodId: string): Recipe | undefined => {
    return gridData.recipes.find((r) => r.materialId === materialId && r.methodId === methodId)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-muted-foreground border-b border-border">
                    Material / Method
                  </th>
                  {gridData.methods.map((method) => (
                    <th
                      key={method.id}
                      className="p-3 text-center text-sm font-semibold text-foreground border-b border-border min-w-[200px]"
                    >
                      <div className="space-y-1">
                        <div>{method.name}</div>
                        <div className="text-xs text-muted-foreground font-normal">{method.capacityPerDay} kg/day</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.materials.map((material) => (
                  <tr key={material.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="p-3 font-medium text-foreground border-b border-border">
                      <div className="space-y-1">
                        <div>{material.name}</div>
                        {material.category && <div className="text-xs text-muted-foreground">{material.category}</div>}
                      </div>
                    </td>
                    {gridData.methods.map((method) => {
                      const recipe = getRecipe(material.id, method.id)
                      return (
                        <td key={method.id} className="p-3 border-b border-border">
                          {recipe ? (
                            <div className="w-full rounded-lg border-2 border-border bg-card">
                              {/* Header with action buttons */}
                              <div className="flex justify-between items-center p-2 border-b border-border">
                                <span className="text-xs font-medium text-muted-foreground">Recipe Actions</span>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onCellClick(recipe)
                                    }}
                                    className="h-6 w-6 p-0"
                                    title="View Details"
                                  >
                                    <MdInfo className="w-3 h-3" />
                                  </Button>
                                  {onDeleteRecipe && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteRecipe(recipe)
                                      }}
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      title="Delete Recipe"
                                    >
                                      <MdDelete className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Recipe content */}
                              <div className="p-3 space-y-2">
                                {/* Recipe Costs */}
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Crew Cost</span>
                                  <span className="font-medium">${recipe.apiRecipe?.crew_cost_per_kg?.toFixed(2) || "0"}/kg</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Energy</span>
                                  <span className="font-medium">{recipe.apiRecipe?.energy_cost_kwh_per_kg?.toFixed(2) || "0"} kWh/kg</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Risk Cost</span>
                                  <span className="font-medium">${recipe.apiRecipe?.risk_cost?.toFixed(2) || "0"}</span>
                                </div>

                                {/* Outputs */}
                                {recipe.outputs && recipe.outputs.length > 0 && (
                                  <div className="border-t border-border pt-2">
                                    <div className="text-xs font-semibold text-foreground mb-1">
                                      Outputs ({recipe.outputs.length})
                                    </div>
                                    <div className="space-y-1">
                                      {recipe.outputs.slice(0, 2).map((output: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground truncate">
                                            {output.output_name || output.product}
                                          </span>
                                          <span className="font-medium text-green-600">
                                            {((output.yield_ratio || output.yield) * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                      ))}
                                      {recipe.outputs.length > 2 && (
                                        <div className="text-xs text-muted-foreground text-center">
                                          +{recipe.outputs.length - 2} more
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => onCreateRecipe?.(material.id, method.id)}
                              className="w-full p-4 rounded-lg border-2 border-dashed border-border bg-secondary/30 hover:bg-secondary/50 text-center transition-colors group"
                            >
                              <div className="space-y-2">
                                <MdAdd className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-foreground transition-colors" />
                                <div className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                  Create Recipe
                                </div>
                                <div className="text-xs text-muted-foreground/70">
                                  {material.name} + {method.name}
                                </div>
                              </div>
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
