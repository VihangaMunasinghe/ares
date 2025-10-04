"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { MdAdd, MdClose } from "react-icons/md"
import { materialsApi } from "@/lib/api/global-entities"
import type { Material as ApiMaterial, MaterialCreate } from "@/lib/api/global-entities"

interface MaterialDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (material: ApiMaterial) => void
  material?: ApiMaterial | null
}

export function MaterialDialog({ isOpen, onClose, onSave, material }: MaterialDialogProps) {
  const [formData, setFormData] = useState<MaterialCreate>({
    key: material?.key || "",
    name: material?.name || "",
    category: material?.category || "other",
    default_mass_per_unit: material?.default_mass_per_unit || 1.0,
    max_input_capacity_kg: material?.max_input_capacity_kg || undefined,
    tags: material?.tags || [],
    safety_flags: material?.safety_flags || {},
  })
  const [newTag, setNewTag] = useState("")
  const [newSafetyFlag, setNewSafetyFlag] = useState({ key: "", value: false })
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const savedMaterial = await materialsApi.create(formData)
      onSave(savedMaterial)
      onClose()
    } catch (error) {
      console.error("Error saving material:", error)
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    })
  }

  const addSafetyFlag = () => {
    if (newSafetyFlag.key.trim()) {
      setFormData({
        ...formData,
        safety_flags: {
          ...formData.safety_flags,
          [newSafetyFlag.key]: newSafetyFlag.value,
        },
      })
      setNewSafetyFlag({ key: "", value: false })
    }
  }

  const removeSafetyFlag = (flagKey: string) => {
    const newFlags = { ...formData.safety_flags }
    delete newFlags[flagKey]
    setFormData({
      ...formData,
      safety_flags: newFlags,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{material ? "Edit Material" : "Add New Material"}</DialogTitle>
          <DialogDescription>
            {material ? "Update the material details below." : "Enter the details for the new material."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Key */}
          <div>
            <Label htmlFor="key">Key *</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="e.g., plastic, metal, textile"
            />
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Plastic Material"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., polymer, metal, fabric"
            />
          </div>

          {/* Mass per unit */}
          <div>
            <Label htmlFor="mass">Default Mass per Unit (kg)</Label>
            <Input
              id="mass"
              type="number"
              step="0.1"
              value={formData.default_mass_per_unit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  default_mass_per_unit: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          {/* Max capacity */}
          <div>
            <Label htmlFor="capacity">Max Input Capacity (kg)</Label>
            <Input
              id="capacity"
              type="number"
              step="0.1"
              value={formData.max_input_capacity_kg || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_input_capacity_kg: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === "Enter" && addTag()}
              />
              <Button size="sm" onClick={addTag}>
                <MdAdd className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <MdClose
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Safety Flags */}
          <div>
            <Label>Safety Flags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSafetyFlag.key}
                onChange={(e) => setNewSafetyFlag({ ...newSafetyFlag, key: e.target.value })}
                placeholder="Flag name (e.g., flammable)"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={newSafetyFlag.value}
                  onCheckedChange={(checked) => setNewSafetyFlag({ ...newSafetyFlag, value: checked })}
                />
                <Button size="sm" onClick={addSafetyFlag}>
                  <MdAdd className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              {Object.entries(formData.safety_flags || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-secondary rounded">
                  <span className="text-sm">{key}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{value ? "True" : "False"}</span>
                    <MdClose
                      className="w-4 h-4 cursor-pointer hover:text-red-500"
                      onClick={() => removeSafetyFlag(key)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.key || !formData.name || isLoading}>
            {isLoading ? "Saving..." : "Save Material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}