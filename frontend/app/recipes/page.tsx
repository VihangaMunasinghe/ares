"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MdUpload, MdDownload, MdFileDownload, MdSettings } from "react-icons/md"
import { RecipesTable } from "./components/RecipesTable"
import { RecipeDetailsPopup } from "./components/RecipeDetailsPopup"
import { UploadRecipes } from "./components/UploadRecipes"
import { MaterialDialog } from "./components/MaterialDialog"
import { MethodDialog } from "./components/MethodDialog"
import { CreateRecipeDialog } from "./components/CreateRecipeDialog"
import { MaterialsMethodsManager } from "./components/MaterialsMethodsManager"
import { materialsApi, methodsApi, recipesApi } from "@/lib/api/global-entities"
import type { Recipe, RecipeGridData } from "@/types/recipe"
import type { Material as ApiMaterial, Method as ApiMethod } from "@/lib/api/global-entities"

// Mock data
const mockData: RecipeGridData = {
  materials: [
    { id: "mat-1", name: "Plastic Film", category: "Polymers" },
    { id: "mat-2", name: "Metal Scraps", category: "Metals" },
  ],
  methods: [
    {
      id: "meth-1",
      name: "Extrude → Filament",
      description: "Extrusion process to create 3D printing filament",
      volumeConstraint: 50,
      capacityPerDay: 10,
    },
    {
      id: "meth-2",
      name: "Compress → Bricks",
      description: "Compression process to create building bricks",
      volumeConstraint: 100,
      capacityPerDay: 25,
    },
  ],
  recipes: [
    {
      id: "rec-1",
      materialId: "mat-1",
      methodId: "meth-1",
      scores: {
        feasibilityScore: 85,
        yieldPercent: 78,
        crewTimeHours: 2.5,
        energyKwh: 15.2,
      },
      inputs: [{ material: "Plastic Film", minQuantity: 1 }],
      outputs: [{ product: "3D Filament", yield: 0.78 }],
      constraints: {
        volumeConstraint: 50,
        capacityPerDay: 10,
      },
      safetyFlags: {
        flammable: false,
        biohazard: false,
        contaminationRisk: false,
      },
    },
    {
      id: "rec-2",
      materialId: "mat-1",
      methodId: "meth-2",
      scores: {
        feasibilityScore: 65,
        yieldPercent: 82,
        crewTimeHours: 1.8,
        energyKwh: 8.5,
      },
      inputs: [{ material: "Plastic Film", minQuantity: 1 }],
      outputs: [{ product: "Plastic Bricks", yield: 0.82 }],
      constraints: {
        volumeConstraint: 100,
        capacityPerDay: 25,
      },
      safetyFlags: {
        flammable: false,
        biohazard: false,
        contaminationRisk: true,
      },
    },
    {
      id: "rec-3",
      materialId: "mat-2",
      methodId: "meth-1",
      scores: {
        feasibilityScore: 45,
        yieldPercent: 55,
        crewTimeHours: 4.2,
        energyKwh: 22.8,
      },
      inputs: [{ material: "Metal Scraps", minQuantity: 1 }],
      outputs: [{ product: "Metal Wire", yield: 0.55 }],
      constraints: {
        volumeConstraint: 50,
        capacityPerDay: 10,
      },
      safetyFlags: {
        flammable: false,
        biohazard: false,
        contaminationRisk: false,
      },
      validationErrors: ["Feasibility score below 50%"],
    },
    {
      id: "rec-4",
      materialId: "mat-2",
      methodId: "meth-2",
      scores: {
        feasibilityScore: 92,
        yieldPercent: 88,
        crewTimeHours: 1.2,
        energyKwh: 12.3,
      },
      inputs: [{ material: "Metal Scraps", minQuantity: 1 }],
      outputs: [{ product: "Metal Blocks", yield: 0.88 }],
      constraints: {
        volumeConstraint: 100,
        capacityPerDay: 25,
      },
      safetyFlags: {
        flammable: false,
        biohazard: false,
        contaminationRisk: false,
      },
    },
  ],
}

export default function RecipesPage() {
  const [gridData, setGridData] = useState<RecipeGridData>(mockData)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  
  // API state
  const [apiMaterials, setApiMaterials] = useState<ApiMaterial[]>([])
  const [apiMethods, setApiMethods] = useState<ApiMethod[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // Dialog state
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false)
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<ApiMaterial | null>(null)
  const [editingMethod, setEditingMethod] = useState<ApiMethod | null>(null)
  
  // Recipe details drawer state
  const [isRecipeDetailsOpen, setIsRecipeDetailsOpen] = useState(false)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("")
  const [selectedMethodId, setSelectedMethodId] = useState<string>("")
  
  // Create recipe dialog state
  const [isCreateRecipeOpen, setIsCreateRecipeOpen] = useState(false)
  const [createRecipeMaterialId, setCreateRecipeMaterialId] = useState<string>("")
  const [createRecipeMethodId, setCreateRecipeMethodId] = useState<string>("")

  const reloadGridData = async () => {
    setIsLoadingData(true)
    try {
      const [materials, methods] = await Promise.all([
        materialsApi.list(),
        methodsApi.list(),
      ])
      setApiMaterials(materials)
      setApiMethods(methods)
      
      // Convert API data to grid format and fetch recipes
      const convertedMaterials = materials.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
      }))
      
      const convertedMethods = methods.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        volumeConstraint: m.min_lot_size,
        capacityPerDay: 10, // Default value since API doesn't have this field
      }))

      // Fetch recipes for each material-method combination
      const recipePromises: Promise<any>[] = []
      const recipeMap: Record<string, any> = {}

      for (const material of materials) {
        for (const method of methods) {
          const promise = recipesApi.getByMaterialMethod({
            material_id: material.id,
            method_id: method.id,
          }).then(async (recipe) => {
            // Get outputs for this recipe
            const outputs = await recipesApi.getOutputsDetailed(recipe.id)
            
            recipeMap[`${material.id}-${method.id}`] = {
              id: recipe.id,
              materialId: material.id,
              methodId: method.id,
              apiRecipe: recipe, // Store the full API recipe
              outputs: outputs, // Store the detailed outputs
              scores: {
                feasibilityScore: 0, // Not used anymore
                yieldPercent: 0, // Not used anymore
                crewTimeHours: recipe.crew_cost_per_kg,
                energyKwh: recipe.energy_cost_kwh_per_kg,
              },
              inputs: [{ material: material.name, minQuantity: 1 }],
              constraints: {
                volumeConstraint: method.min_lot_size,
                capacityPerDay: 10,
              },
              safetyFlags: {
                flammable: material.safety_flags?.flammable || false,
                biohazard: material.safety_flags?.biohazard || false,
                contaminationRisk: material.safety_flags?.contaminationRisk || false,
              },
            }
          }).catch((error) => {
            // Recipe doesn't exist for this combination
            console.log(`No recipe found for ${material.name} + ${method.name}`)
            return null
          })
          
          recipePromises.push(promise)
        }
      }

      // Wait for all recipe fetches to complete
      await Promise.allSettled(recipePromises)

      const recipes = Object.values(recipeMap)
      
      const convertedGridData: RecipeGridData = {
        materials: convertedMaterials,
        methods: convertedMethods,
        recipes: recipes,
      }
      
      setGridData(convertedGridData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load data from API on mount
  useEffect(() => {
    reloadGridData()
  }, [])

  const handleCellClick = (recipe: Recipe) => {
    // Open the new RecipeDetailsDrawer with delete functionality
    setSelectedMaterialId(recipe.materialId)
    setSelectedMethodId(recipe.methodId)
    setIsRecipeDetailsOpen(true)

  }

  const handleCreateRecipe = (materialId: string, methodId: string) => {
    setCreateRecipeMaterialId(materialId)
    setCreateRecipeMethodId(methodId)
    setIsCreateRecipeOpen(true)
  }

  const handleRecipeCreated = async (recipe: any) => {
    // Reload the grid data to show the new recipe
    await reloadGridData()
  }

  const handleRecipeDeleted = async () => {
    // Reload the grid data to remove the deleted recipe
    await reloadGridData()
  }

  const handleDeleteRecipe = async (recipe: Recipe) => {
    if (!recipe.apiRecipe?.id) return
    
    if (confirm(`Are you sure you want to delete this recipe for ${recipe.materialId} + ${recipe.methodId}?`)) {
      try {
        await recipesApi.delete(recipe.apiRecipe.id)
        await reloadGridData() // Refresh the grid
      } catch (error) {
        console.error("Error deleting recipe:", error)
        alert("Failed to delete recipe. Please try again.")
      }
    }
  }

  // Material handlers
  const handleSaveMaterial = (material: ApiMaterial) => {
    setApiMaterials((prev) => [...prev, material])
    setGridData((prev) => ({
      ...prev,
      materials: [...prev.materials, {
        id: material.id,
        name: material.name,
        category: material.category,
      }],
    }))
    setIsMaterialDialogOpen(false)
    setEditingMaterial(null)
  }

  const handleAddMaterial = () => {
    setEditingMaterial(null)
    setIsMaterialDialogOpen(true)
  }

  // Method handlers
  const handleSaveMethod = (method: ApiMethod) => {
    setApiMethods((prev) => [...prev, method])
    setGridData((prev) => ({
      ...prev,
      methods: [...prev.methods, {
        id: method.id,
        name: method.name,
        description: method.description,
        volumeConstraint: method.min_lot_size,
        capacityPerDay: 10, // Default value
      }],
    }))
    setIsMethodDialogOpen(false)
    setEditingMethod(null)
  }

  const handleAddMethod = () => {
    setEditingMethod(null)
    setIsMethodDialogOpen(true)
  }

  // Update handlers for manager component
  const handleMaterialsChange = (updatedMaterials: ApiMaterial[]) => {
    setApiMaterials(updatedMaterials)
    setGridData((prev) => ({
      ...prev,
      materials: updatedMaterials.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
      })),
    }))
  }

  const handleMethodsChange = (updatedMethods: ApiMethod[]) => {
    setApiMethods(updatedMethods)
    setGridData((prev) => ({
      ...prev,
      methods: updatedMethods.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        volumeConstraint: m.min_lot_size,
        capacityPerDay: 10, // Default value
      })),
    }))
  }

  const handleExportCSV = () => {
    // Generate CSV from grid data
    const headers = ["Material", ...gridData.methods.map((m) => m.name)]
    const rows = gridData.materials.map((material) => {
      const row = [material.name]
      gridData.methods.forEach((method) => {
        const recipe = gridData.recipes.find((r) => r.materialId === material.id && r.methodId === method.id)
        row.push(recipe ? `${recipe.scores.feasibilityScore}%` : "N/A")
      })
      return row
    })

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "recipes-grid.csv"
    a.click()
  }

  const handleDownloadTemplate = () => {
    const template = {
      materials: [{ id: "mat-1", name: "Material Name", category: "Category" }],
      methods: [
        {
          id: "meth-1",
          name: "Method Name",
          description: "Description",
          volumeConstraint: 0,
          capacityPerDay: 0,
        },
      ],
      recipes: [
        {
          id: "rec-1",
          materialId: "mat-1",
          methodId: "meth-1",
          scores: {
            feasibilityScore: 0,
            yieldPercent: 0,
            crewTimeHours: 0,
            energyKwh: 0,
          },
          inputs: [{ material: "Material Name", minQuantity: 0 }],
          outputs: [{ product: "Product Name", yield: 0 }],
          constraints: {
            volumeConstraint: 0,
            capacityPerDay: 0,
          },
          safetyFlags: {
            flammable: false,
            biohazard: false,
            contaminationRisk: false,
          },
        },
      ],
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "recipe-template.json"
    a.click()
  }

  return (
    <div className="space-y-3 p-3">
      {/* NASA-style Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4 font-technical">RECIPE INPUT DASHBOARD</h1>
        <p className="text-muted-foreground mt-2 font-technical tracking-wide text-sm">
          Define and manage recycling recipes for Mars missions • Sol 1247 • ARES Mission Control
        </p>
      </div>

      {/* Enhanced Main Content Tabs */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="recipes" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/30 border border-border/50">
              <TabsTrigger 
                value="recipes" 
                className="font-technical text-xs tracking-wider uppercase data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                RECIPE GRID
              </TabsTrigger>
              <TabsTrigger 
                value="manage" 
                className="gap-2 font-technical text-xs tracking-wider uppercase data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <MdSettings className="w-4 h-4" />
                MANAGE MATERIALS & METHODS
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recipes" className="mt-6">
              {isLoadingData ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground font-technical text-sm tracking-wider">LOADING RECIPE DATA...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  <RecipesTable 
                    gridData={gridData} 
                    onCellClick={handleCellClick} 
                    onDataChange={setGridData}
                    onCreateRecipe={handleCreateRecipe}
                    onDeleteRecipe={handleDeleteRecipe}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="manage" className="mt-6">
              <div className="space-y-4">
                {/* Management Status */}
                <div className="p-4 bg-secondary/20 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs font-technical text-blue-400 uppercase tracking-wider">
                          MANAGEMENT MODE
                        </span>
                      </div>
                      <span className="text-sm font-technical text-muted-foreground">
                        Configure global materials and processing methods
                      </span>
                    </div>
                  </div>
                </div>
                
                <MaterialsMethodsManager
                  materials={apiMaterials}
                  methods={apiMethods}
                  onMaterialsChange={handleMaterialsChange}
                  onMethodsChange={handleMethodsChange}
                  onAddMaterial={handleAddMaterial}
                  onAddMethod={handleAddMethod}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recipe Details Popup */}
      <RecipeDetailsPopup
        isOpen={isRecipeDetailsOpen}
        onClose={() => setIsRecipeDetailsOpen(false)}
        onRecipeDeleted={handleRecipeDeleted}
        materialId={selectedMaterialId}
        methodId={selectedMethodId}
        materials={apiMaterials}
        methods={apiMethods}
      />

      {/* Upload Modal */}
      <UploadRecipes
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={(data) => {
          setGridData(data)
          setIsUploadOpen(false)
        }}
      />

      {/* Create Recipe Dialog */}
      <CreateRecipeDialog
        isOpen={isCreateRecipeOpen}
        onClose={() => setIsCreateRecipeOpen(false)}
        onRecipeCreated={handleRecipeCreated}
        materialId={createRecipeMaterialId}
        methodId={createRecipeMethodId}
        materials={apiMaterials}
        methods={apiMethods}
      />

      {/* Material Dialog */}
      <MaterialDialog
        isOpen={isMaterialDialogOpen}
        onClose={() => {
          setIsMaterialDialogOpen(false)
          setEditingMaterial(null)
        }}
        onSave={handleSaveMaterial}
        material={editingMaterial}
      />

      {/* Method Dialog */}
      <MethodDialog
        isOpen={isMethodDialogOpen}
        onClose={() => {
          setIsMethodDialogOpen(false)
          setEditingMethod(null)
        }}
        onSave={handleSaveMethod}
        method={editingMethod}
      />
    </div>
  )
}
