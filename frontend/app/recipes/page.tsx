"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MdUpload, MdDownload, MdFileDownload, MdSettings } from "react-icons/md"
import { RecipesTable } from "./components/RecipesTable"
import { RecipeDetailDrawer } from "./components/RecipeDetailDrawer"
import { UploadRecipes } from "./components/UploadRecipes"
import { MaterialDialog } from "./components/MaterialDialog"
import { MethodDialog } from "./components/MethodDialog"
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
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
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

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const [materials, methods] = await Promise.all([
          materialsApi.list(),
          methodsApi.list(),
        ])
        setApiMaterials(materials)
        setApiMethods(methods)
        
        // Convert API data to grid format for compatibility
        const convertedGridData: RecipeGridData = {
          materials: materials.map(m => ({
            id: m.id,
            name: m.name,
            category: m.category,
          })),
          methods: methods.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            volumeConstraint: m.min_lot_size,
            capacityPerDay: 10, // Default value since API doesn't have this field
          })),
          recipes: mockData.recipes, // Keep mock recipes for now
        }
        setGridData(convertedGridData)
      } catch (error) {
        console.error("Error loading data:", error)
        // Fallback to mock data if API fails
        setGridData(mockData)
      } finally {
        setIsLoadingData(false)
      }
    }
    
    loadData()
  }, [])

  const handleCellClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsDrawerOpen(true)
  }

  const handleSaveRecipe = (updatedRecipe: Recipe) => {
    setGridData((prev) => ({
      ...prev,
      recipes: prev.recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)),
    }))
    setIsDrawerOpen(false)
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
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recipe Input Dashboard</h1>
          <p className="text-muted-foreground mt-1">Define and manage recycling recipes for Mars missions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 bg-transparent">
            <MdDownload className="w-4 h-4" />
            Download Template
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-transparent">
            <MdFileDownload className="w-4 h-4" />
            Export Grid (CSV)
          </Button>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
            <MdUpload className="w-4 h-4" />
            Upload CSV/JSON
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recipes">Recipe Grid</TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <MdSettings className="w-4 h-4" />
            Manage Materials & Methods
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recipes" className="mt-6">
          {isLoadingData ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          ) : (
            <RecipesTable gridData={gridData} onCellClick={handleCellClick} onDataChange={setGridData} />
          )}
        </TabsContent>
        
        <TabsContent value="manage" className="mt-6">
          <MaterialsMethodsManager
            materials={apiMaterials}
            methods={apiMethods}
            onMaterialsChange={handleMaterialsChange}
            onMethodsChange={handleMethodsChange}
            onAddMaterial={handleAddMaterial}
            onAddMethod={handleAddMethod}
          />
        </TabsContent>
      </Tabs>

      {/* Recipe Detail Drawer */}
      <RecipeDetailDrawer
        recipe={selectedRecipe}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveRecipe}
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
