"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MdAccessTime, MdBolt, MdWarning } from "react-icons/md"
import type { Recipe, RecipeGridData, Material, Method } from "@/types/recipe"
import { cn } from "@/lib/utils"

interface RecipesTableProps {
  gridData: RecipeGridData
  onCellClick: (recipe: Recipe) => void
  onDataChange: (data: RecipeGridData) => void
}

export function RecipesTable({ gridData, onCellClick, onDataChange }: RecipesTableProps) {
  const getRecipe = (materialId: string, methodId: string): Recipe | undefined => {
    return gridData.recipes.find((r) => r.materialId === materialId && r.methodId === methodId)
  }

  const getFeasibilityColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/50 text-green-400"
    if (score >= 50) return "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
    return "bg-red-500/20 border-red-500/50 text-red-400"
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
                            <button
                              onClick={() => onCellClick(recipe)}
                              className={cn(
                                "w-full p-3 rounded-lg border-2 transition-all hover:shadow-md",
                                getFeasibilityColor(recipe.scores.feasibilityScore),
                              )}
                            >
                              <div className="space-y-2">
                                {/* Feasibility Badge */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold">Feasibility</span>
                                  <span className="text-lg font-bold">{recipe.scores.feasibilityScore}%</span>
                                </div>

                                {/* Yield */}
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Yield</span>
                                  <span className="font-medium">{recipe.scores.yieldPercent}%</span>
                                </div>

                                {/* Crew Time & Energy */}
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-1">
                                    <MdAccessTime className="w-3 h-3" />
                                    <span>{recipe.scores.crewTimeHours}h</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MdBolt className="w-3 h-3" />
                                    <span>{recipe.scores.energyKwh}kWh</span>
                                  </div>
                                </div>

                                {/* Validation Errors */}
                                {recipe.validationErrors && recipe.validationErrors.length > 0 && (
                                  <div className="flex items-center gap-1 text-red-400 text-xs">
                                    <MdWarning className="w-3 h-3" />
                                    <span>Validation issues</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          ) : (
                            <div className="w-full p-3 rounded-lg border-2 border-dashed border-border bg-secondary/30 text-center text-xs text-muted-foreground">
                              No recipe
                            </div>
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
