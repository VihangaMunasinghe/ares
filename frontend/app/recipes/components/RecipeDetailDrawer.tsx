"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MdClose, MdSave, MdWarning } from "react-icons/md"
import type { Recipe } from "@/types/recipe"

interface RecipeDetailDrawerProps {
  recipe: Recipe | null
  isOpen: boolean
  onClose: () => void
  onSave: (recipe: Recipe) => void
}

export function RecipeDetailDrawer({ recipe, isOpen, onClose, onSave }: RecipeDetailDrawerProps) {
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    if (recipe) {
      setEditedRecipe({ ...recipe })
    }
  }, [recipe])

  if (!isOpen || !editedRecipe) return null

  const handleSave = () => {
    if (editedRecipe) {
      onSave(editedRecipe)
    }
  }

  const updateScore = (field: keyof Recipe["scores"], value: number) => {
    setEditedRecipe((prev) =>
      prev
        ? {
            ...prev,
            scores: {
              ...prev.scores,
              [field]: value,
            },
          }
        : null,
    )
  }

  const updateConstraint = (field: keyof Recipe["constraints"], value: number) => {
    setEditedRecipe((prev) =>
      prev
        ? {
            ...prev,
            constraints: {
              ...prev.constraints,
              [field]: value,
            },
          }
        : null,
    )
  }

  const updateSafetyFlag = (field: keyof Recipe["safetyFlags"], value: boolean) => {
    setEditedRecipe((prev) =>
      prev
        ? {
            ...prev,
            safetyFlags: {
              ...prev.safetyFlags,
              [field]: value,
            },
          }
        : null,
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Recipe Details</h2>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <MdClose className="w-5 h-5" />
            </Button>
          </div>

          {/* Validation Errors */}
          {editedRecipe.validationErrors && editedRecipe.validationErrors.length > 0 && (
            <Card className="p-4 bg-red-500/10 border-red-500/50">
              <div className="flex items-start gap-2">
                <MdWarning className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-red-400">Validation Issues</p>
                  {editedRecipe.validationErrors.map((error, idx) => (
                    <p key={idx} className="text-xs text-red-300">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Inputs */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Inputs</h3>
            {editedRecipe.inputs.map((input, idx) => (
              <Card key={idx} className="p-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">{input.material}</div>
                  <div className="text-xs text-muted-foreground">Min Quantity: {input.minQuantity} kg</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Outputs */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Outputs</h3>
            {editedRecipe.outputs.map((output, idx) => (
              <Card key={idx} className="p-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">{output.product}</div>
                  <div className="text-xs text-muted-foreground">Yield: {(output.yield * 100).toFixed(0)}%</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Scores */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Feasibility Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedRecipe.scores.feasibilityScore}
                  onChange={(e) => updateScore("feasibilityScore", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Yield (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedRecipe.scores.yieldPercent}
                  onChange={(e) => updateScore("yieldPercent", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Crew Time (hours/kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editedRecipe.scores.crewTimeHours}
                  onChange={(e) => updateScore("crewTimeHours", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Energy (kWh/kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editedRecipe.scores.energyKwh}
                  onChange={(e) => updateScore("energyKwh", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Constraints</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Volume Constraint (L)</label>
                <input
                  type="number"
                  min="0"
                  value={editedRecipe.constraints.volumeConstraint || 0}
                  onChange={(e) => updateConstraint("volumeConstraint", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Capacity Per Day (kg/day)</label>
                <input
                  type="number"
                  min="0"
                  value={editedRecipe.constraints.capacityPerDay || 0}
                  onChange={(e) => updateConstraint("capacityPerDay", Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Safety Flags */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Safety Flags</h3>
            <div className="space-y-3">
              {(["flammable", "biohazard", "contaminationRisk"] as const).map((flag) => (
                <label key={flag} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedRecipe.safetyFlags[flag]}
                    onChange={(e) => updateSafetyFlag(flag, e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-foreground capitalize">{flag.replace(/([A-Z])/g, " $1").trim()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave} className="flex-1 gap-2">
              <MdSave className="w-4 h-4" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
