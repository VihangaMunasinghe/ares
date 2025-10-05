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
import { methodsApi } from "@/lib/api/global-entities"
import type { Method as ApiMethod, MethodCreate } from "@/lib/api/global-entities"

interface MethodDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (method: ApiMethod) => void
  method?: ApiMethod | null
}

export function MethodDialog({ isOpen, onClose, onSave, method }: MethodDialogProps) {
  const [formData, setFormData] = useState<MethodCreate>({
    key: method?.key || "",
    name: method?.name || "",
    description: method?.description || "",
    min_lot_size: method?.min_lot_size || 1.0,
    tools_required: method?.tools_required || [],
    availability_default: method?.availability_default ?? true,
  })
  const [newTool, setNewTool] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const savedMethod = await methodsApi.create(formData)
      onSave(savedMethod)
      onClose()
    } catch (error) {
      console.error("Error saving method:", error)
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  const addTool = () => {
    if (newTool.trim() && !formData.tools_required?.includes(newTool.trim())) {
      setFormData({
        ...formData,
        tools_required: [...(formData.tools_required || []), newTool.trim()],
      })
      setNewTool("")
    }
  }

  const removeTool = (toolToRemove: string) => {
    setFormData({
      ...formData,
      tools_required: formData.tools_required?.filter((tool) => tool !== toolToRemove) || [],
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{method ? "Edit Method" : "Add New Method"}</DialogTitle>
          <DialogDescription>
            {method ? "Update the method details below." : "Enter the details for the new method."}
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
              placeholder="e.g., extrude, compress, heat"
            />
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Extrusion Process"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the method..."
              rows={3}
            />
          </div>

          {/* Min lot size */}
          <div>
            <Label htmlFor="min_lot_size">Minimum Lot Size</Label>
            <Input
              id="min_lot_size"
              type="number"
              step="0.1"
              value={formData.min_lot_size || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_lot_size: e.target.value ? parseFloat(e.target.value) : 1.0,
                })
              }
            />
          </div>

          {/* Tools Required */}
          <div>
            <Label>Tools Required</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                placeholder="Add a tool"
                onKeyPress={(e) => e.key === "Enter" && addTool()}
              />
              <Button size="sm" onClick={addTool}>
                <MdAdd className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tools_required?.map((tool) => (
                <Badge key={tool} variant="secondary" className="gap-1">
                  {tool}
                  <MdClose
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeTool(tool)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Availability Default */}
          <div className="flex items-center justify-between">
            <Label htmlFor="availability">Available by Default</Label>
            <Switch
              id="availability"
              checked={formData.availability_default}
              onCheckedChange={(checked) => setFormData({ ...formData, availability_default: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.key || !formData.name || isLoading}>
            {isLoading ? "Saving..." : "Save Method"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}