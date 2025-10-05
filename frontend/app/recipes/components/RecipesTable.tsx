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
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm mission-card-glow">
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left text-sm font-technical font-semibold text-primary uppercase tracking-wider border-b border-border/50">
                    MATERIAL / METHOD
                  </th>
                  {gridData.methods.map((method) => (
                    <th
                      key={method.id}
                      className="p-4 text-center text-sm font-technical font-semibold text-primary uppercase tracking-wider border-b border-border/50 min-w-64"
                    >
                      <div className="space-y-2">
                        <div className="font-bold">{method.name}</div>
                        <div className="text-xs text-accent font-normal bg-accent/10 px-2 py-1 rounded border border-accent/20">
                          {method.capacityPerDay} kg/day
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {gridData.materials.map((material) => (
                  <tr key={material.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="p-4 border-r border-border/30 bg-card/50">
                      <div className="space-y-2">
                        <div className="font-semibold text-foreground font-technical">{material.name}</div>
                        {material.category && (
                          <div className="text-xs text-muted-foreground font-technical uppercase tracking-wider bg-muted/30 px-2 py-1 rounded border border-muted/50">
                            {material.category}
                          </div>
                        )}
                      </div>
                    </td>
                    {gridData.methods.map((method) => {
                      const recipe = getRecipe(material.id, method.id)
                      return (
                        <td key={method.id} className="p-2 border-r border-border/30 last:border-r-0">
                          {recipe ? (
                            <div className="relative group/recipe">
                              <div 
                                className="bg-card/90 border border-border/50 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-accent/50 mission-card-glow backdrop-blur-sm"
                                onClick={() => onCellClick(recipe)}
                              >
                                {/* Recipe header with actions */}
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg border-b border-border/30">
                                  <div className="text-xs font-technical uppercase tracking-wider text-primary font-semibold">
                                    Recipe Actions
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/recipe:opacity-100 transition-opacity duration-200">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onCellClick(recipe)
                                      }}
                                      className="h-7 w-7 p-0 hover:bg-accent/20 rounded-full"
                                      title="View Details"
                                    >
                                      <MdInfo className="w-4 h-4 text-accent" />
                                    </Button>
                                    {onDeleteRecipe && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onDeleteRecipe(recipe)
                                        }}
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
                                        title="Delete Recipe"
                                      >
                                        <MdDelete className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Recipe content */}
                                <div className="p-3 space-y-3">
                                  {/* Recipe Costs */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground font-technical">Crew Cost</span>
                                      <span className="font-semibold text-accent">${recipe.apiRecipe?.crew_cost_per_kg?.toFixed(2) || "0"}/kg</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground font-technical">Energy</span>
                                      <span className="font-semibold text-accent">{recipe.apiRecipe?.energy_cost_kwh_per_kg?.toFixed(2) || "0"} kWh/kg</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground font-technical">Risk Cost</span>
                                      <span className="font-semibold text-accent">${recipe.apiRecipe?.risk_cost?.toFixed(2) || "0"}</span>
                                    </div>
                                  </div>

                                  {/* Outputs */}
                                  {recipe.outputs && recipe.outputs.length > 0 && (
                                    <div className="border-t border-border/30 pt-3">
                                      <div className="text-xs font-technical uppercase tracking-wider text-primary font-semibold mb-2">
                                        Outputs ({recipe.outputs.length})
                                      </div>
                                      <div className="space-y-1.5">
                                        {recipe.outputs.slice(0, 1).map((output: any, index: number) => (
                                          <div key={index} className="flex items-center justify-between text-sm bg-secondary/20 p-2 rounded border border-secondary/30">
                                            <span className="text-foreground truncate font-medium">
                                              {output.output_name || output.product}
                                            </span>
                                            <span className="font-bold text-green-400 font-technical">
                                              {((output.yield_ratio || output.yield) * 100).toFixed(0)}%
                                            </span>
                                          </div>
                                        ))}
                                        {recipe.outputs.length > 1 && (
                                          <div className="text-xs text-muted-foreground text-center py-1 font-technical">
                                            +{recipe.outputs.length - 1} more output{recipe.outputs.length > 2 ? 's' : ''}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full min-h-[200px] flex items-center justify-center">
                              <Button
                                size="lg"
                                variant="ghost"
                                onClick={() => onCreateRecipe?.(material.id, method.id)}
                                className="h-32 w-full rounded-lg border-2 border-dashed border-border/50 text-muted-foreground hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all duration-300 mission-card-glow group"
                                title={`Create recipe for ${material.name} + ${method.name}`}
                              >
                                <div className="space-y-3 text-center">
                                  <MdAdd className="w-8 h-8 mx-auto group-hover:scale-110 transition-transform duration-200" />
                                  <div className="space-y-1">
                                    <div className="text-sm font-technical uppercase tracking-wider font-semibold">
                                      Create Recipe
                                    </div>
                                    <div className="text-xs text-muted-foreground/70 font-technical">
                                      {material.name} + {method.name}
                                    </div>
                                  </div>
                                </div>
                              </Button>
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
