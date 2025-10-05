"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MdAdd, MdDelete, MdSave } from "react-icons/md"
import { recipesApi, outputsApi, recipeOutputsApi } from "@/lib/api/global-entities"
import type { 
  Material as ApiMaterial, 
  Method as ApiMethod, 
  Recipe as ApiRecipe, 
  Output, 
  RecipeOutputDetailed,
  RecipeOutputCreate 
} from "@/lib/api/global-entities"

interface NewRecipeOutput {
  output_id: string
  yield_ratio: number
}

interface CreateRecipeDialogProps {
  isOpen: boolean
  onClose: () => void
  onRecipeCreated: (recipe: any) => void
  materialId?: string
  methodId?: string
  materials: ApiMaterial[]
  methods: ApiMethod[]
}

export function CreateRecipeDialog({
  isOpen,
  onClose,
  onRecipeCreated,
  materialId,
  methodId,
  materials,
  methods,
}: CreateRecipeDialogProps) {
  const [formData, setFormData] = useState({
    material_id: materialId || "",
    method_id: methodId || "",
    crew_cost_per_kg: 0,
    energy_cost_kwh_per_kg: 0,
    risk_cost: 0,
  })
  const [outputs, setOutputs] = useState<Output[]>([])
  const [recipeOutputs, setRecipeOutputs] = useState<NewRecipeOutput[]>([])
  const [newOutput, setNewOutput] = useState<NewRecipeOutput>({
    output_id: "",
    yield_ratio: 1,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadOutputs()
      setFormData({
        material_id: materialId || "",
        method_id: methodId || "",
        crew_cost_per_kg: 0,
        energy_cost_kwh_per_kg: 0,
        risk_cost: 0,
      })
      setRecipeOutputs([])
    }
  }, [isOpen, materialId, methodId])

  const loadOutputs = async () => {
    setIsLoadingOutputs(true)
    try {
      const outputsData = await outputsApi.list()
      setOutputs(outputsData)
    } catch (error) {
      console.error("Error loading outputs:", error)
    } finally {
      setIsLoadingOutputs(false)
    }
  }

  const handleSave = async () => {
    if (!formData.material_id || !formData.method_id) {
      alert("Please select both material and method")
      return
    }

    setIsLoading(true)
    try {
      // Create the recipe
      const recipe = await recipesApi.create(formData)

      // Create recipe outputs
      for (const recipeOutput of recipeOutputs) {
        await recipeOutputsApi.create({
          recipe_id: recipe.id,
          output_id: recipeOutput.output_id,
          yield_ratio: recipeOutput.yield_ratio,
        })
      }

      onRecipeCreated(recipe)
      onClose()
    } catch (error) {
      console.error("Error creating recipe:", error)
      alert("Failed to create recipe. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const addRecipeOutput = () => {
    if (!newOutput.output_id) {
      alert("Please select an output")
      return
    }

    if (recipeOutputs.some(ro => ro.output_id === newOutput.output_id)) {
      alert("This output is already added")
      return
    }

    setRecipeOutputs([...recipeOutputs, { ...newOutput }])
    setNewOutput({ output_id: "", yield_ratio: 1 })
  }

  const removeRecipeOutput = (outputId: string) => {
    setRecipeOutputs(recipeOutputs.filter(ro => ro.output_id !== outputId))
  }

  const getOutputName = (outputId: string) => {
    return outputs.find(o => o.id === outputId)?.name || "Unknown Output"
  }

  const selectedMaterial = materials.find(m => m.id === formData.material_id)
  const selectedMethod = methods.find(m => m.id === formData.method_id)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Recipe</DialogTitle>
          <DialogDescription>
            Define a new recipe with material, method, costs, and outputs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Material and Method Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material">Material *</Label>
              <Select
                value={formData.material_id}
                onValueChange={(value) => setFormData({ ...formData, material_id: value })}
                disabled={!!materialId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="method">Method *</Label>
              <Select
                value={formData.method_id}
                onValueChange={(value) => setFormData({ ...formData, method_id: value })}
                disabled={!!methodId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Info */}
          {selectedMaterial && selectedMethod && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recipe Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><strong>Material:</strong> {selectedMaterial.name} ({selectedMaterial.category})</p>
                  <p><strong>Method:</strong> {selectedMethod.name}</p>
                  {selectedMethod.description && (
                    <p className="text-muted-foreground">{selectedMethod.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cost Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recipe Costs</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="crew_cost">Crew Cost ($/kg)</Label>
                <Input
                  id="crew_cost"
                  type="number"
                  step="0.01"
                  value={formData.crew_cost_per_kg}
                  onChange={(e) =>
                    setFormData({ ...formData, crew_cost_per_kg: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="energy_cost">Energy Cost (kWh/kg)</Label>
                <Input
                  id="energy_cost"
                  type="number"
                  step="0.01"
                  value={formData.energy_cost_kwh_per_kg}
                  onChange={(e) =>
                    setFormData({ ...formData, energy_cost_kwh_per_kg: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="risk_cost">Risk Cost ($)</Label>
                <Input
                  id="risk_cost"
                  type="number"
                  step="0.01"
                  value={formData.risk_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, risk_cost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>

          {/* Recipe Outputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recipe Outputs</h3>
            
            {/* Add Output */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={newOutput.output_id}
                  onValueChange={(value) => setNewOutput({ ...newOutput, output_id: value })}
                  disabled={isLoadingOutputs}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOutputs ? "Loading outputs..." : "Select output"} />
                  </SelectTrigger>
                  <SelectContent>
                    {outputs.map((output) => (
                      <SelectItem key={output.id} value={output.id}>
                        {output.name} ({output.units_label})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={newOutput.yield_ratio}
                  onChange={(e) =>
                    setNewOutput({ ...newOutput, yield_ratio: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Yield ratio"
                />
              </div>
              <Button onClick={addRecipeOutput} size="sm">
                <MdAdd className="w-4 h-4" />
              </Button>
            </div>

            {/* Added Outputs */}
            {recipeOutputs.length > 0 && (
              <div className="space-y-2">
                {recipeOutputs.map((recipeOutput, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{getOutputName(recipeOutput.output_id)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({(recipeOutput.yield_ratio * 100).toFixed(1)}% yield)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipeOutput(recipeOutput.output_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <MdDelete className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <MdSave className="w-4 h-4" />
            {isLoading ? "Creating..." : "Create Recipe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}