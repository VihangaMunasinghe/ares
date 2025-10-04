"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { MdDelete, MdAdd, MdEdit } from "react-icons/md"
import { materialsApi, methodsApi } from "@/lib/api/global-entities"
import type { Material as ApiMaterial, Method as ApiMethod } from "@/lib/api/global-entities"

interface MaterialsMethodsManagerProps {
  materials: ApiMaterial[]
  methods: ApiMethod[]
  onMaterialsChange: (materials: ApiMaterial[]) => void
  onMethodsChange: (methods: ApiMethod[]) => void
  onAddMaterial: () => void
  onAddMethod: () => void
}

export function MaterialsMethodsManager({
  materials,
  methods,
  onMaterialsChange,
  onMethodsChange,
  onAddMaterial,
  onAddMethod,
}: MaterialsMethodsManagerProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    type: "material" | "method"
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return

    setIsDeleting(true)
    try {
      if (deleteDialog.type === "material") {
        await materialsApi.delete(deleteDialog.id)
        onMaterialsChange(materials.filter((m) => m.id !== deleteDialog.id))
      } else {
        await methodsApi.delete(deleteDialog.id)
        onMethodsChange(methods.filter((m) => m.id !== deleteDialog.id))
      }
    } catch (error) {
      console.error(`Error deleting ${deleteDialog.type}:`, error)
      // You might want to show a toast notification here
    } finally {
      setIsDeleting(false)
      setDeleteDialog(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Materials Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Materials ({materials.length})</CardTitle>
          <Button size="sm" onClick={onAddMaterial} className="gap-1">
            <MdAdd className="w-4 h-4" />
            Add Material
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {materials.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No materials yet</p>
            ) : (
              materials.map((material) => (
                <div key={material.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{material.name}</h4>
                      <p className="text-sm text-muted-foreground">Key: {material.key}</p>
                      <p className="text-sm text-muted-foreground">Category: {material.category}</p>
                      {material.default_mass_per_unit && (
                        <p className="text-sm text-muted-foreground">
                          Mass: {material.default_mass_per_unit}kg/unit
                        </p>
                      )}
                      {material.max_input_capacity_kg && (
                        <p className="text-sm text-muted-foreground">
                          Max capacity: {material.max_input_capacity_kg}kg
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          type: "material",
                          id: material.id,
                          name: material.name,
                        })
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <MdDelete className="w-4 h-4" />
                    </Button>
                  </div>
                  {material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {material.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {Object.keys(material.safety_flags).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(material.safety_flags).map(([key, value]) => (
                        <Badge key={key} variant={value ? "destructive" : "secondary"} className="text-xs">
                          {key}: {value ? "⚠️" : "✅"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Methods Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Methods ({methods.length})</CardTitle>
          <Button size="sm" onClick={onAddMethod} className="gap-1">
            <MdAdd className="w-4 h-4" />
            Add Method
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {methods.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No methods yet</p>
            ) : (
              methods.map((method) => (
                <div key={method.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{method.name}</h4>
                      <p className="text-sm text-muted-foreground">Key: {method.key}</p>
                      {method.description && (
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Min lot size: {method.min_lot_size}</p>
                      <p className="text-sm text-muted-foreground">
                        Available: {method.availability_default ? "Yes" : "No"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          type: "method",
                          id: method.id,
                          name: method.name,
                        })
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <MdDelete className="w-4 h-4" />
                    </Button>
                  </div>
                  {method.tools_required.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {method.tools_required.map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog?.isOpen} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone and may affect
              existing recipes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}