"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MdUpload, MdDownload, MdFileDownload } from "react-icons/md"
import { RecipesTable } from "./components/RecipesTable"
import { RecipeDetailDrawer } from "./components/RecipeDetailDrawer"
import { UploadRecipes } from "./components/UploadRecipes"
import type { Recipe, RecipeGridData } from "@/types/recipe"

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

      {/* Recipes Table */}
      <RecipesTable gridData={gridData} onCellClick={handleCellClick} onDataChange={setGridData} />

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
    </div>
  )
}
