"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MdArrowForward, MdArrowBack, MdAdd, MdDelete } from "react-icons/md"
import type { ItemTemplate } from "@/types/items"

interface ItemFormProps {
  item?: ItemTemplate | null
  open: boolean
  onClose: () => void
  onSave: (item: Partial<ItemTemplate>) => void
}

export function ItemForm({ item, open, onClose, onSave }: ItemFormProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<ItemTemplate>>(
    item || {
      name: "",
      category: "consumable",
      unit: "unit",
      mass_per_unit_kg: 0,
      composition: [],
      waste_mappings: [],
      safety_flags: {},
      tags: [],
    },
  )

  const totalSteps = 5

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
    setStep(1)
  }

  const compositionSum = formData.composition?.reduce((sum, comp) => sum + comp.percent_by_mass, 0) || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={idx} className={`h-1 flex-1 rounded ${idx < step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {/* Step 1: Identity & Physicals */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Food Packaging Pouch"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumable">Consumable</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">unit</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="pack">pack</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer || ""}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku || ""}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mass">Mass per Unit (kg) *</Label>
                <Input
                  id="mass"
                  type="number"
                  step="0.001"
                  value={formData.mass_per_unit_kg}
                  onChange={(e) =>
                    setFormData({ ...formData, mass_per_unit_kg: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="volume">Volume per Unit (L)</Label>
                <Input
                  id="volume"
                  type="number"
                  step="0.1"
                  value={formData.volume_per_unit_l || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, volume_per_unit_l: Number.parseFloat(e.target.value) || undefined })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Composition */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Composition (must sum to 100%)</Label>
              <Badge variant={Math.abs(compositionSum - 100) < 0.01 ? "default" : "destructive"}>
                Total: {compositionSum.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-2">
              {formData.composition?.map((comp, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Material</Label>
                    <Input
                      value={comp.material_name}
                      onChange={(e) => {
                        const newComp = [...(formData.composition || [])]
                        newComp[idx].material_name = e.target.value
                        setFormData({ ...formData, composition: newComp })
                      }}
                      placeholder="e.g., LDPE Plastic"
                    />
                  </div>
                  <div className="w-32">
                    <Label>Percent</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={comp.percent_by_mass}
                      onChange={(e) => {
                        const newComp = [...(formData.composition || [])]
                        newComp[idx].percent_by_mass = Number.parseFloat(e.target.value) || 0
                        setFormData({ ...formData, composition: newComp })
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newComp = formData.composition?.filter((_, i) => i !== idx)
                      setFormData({ ...formData, composition: newComp })
                    }}
                  >
                    <MdDelete className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const newComp = [
                  ...(formData.composition || []),
                  {
                    material_id: `mat-${Date.now()}`,
                    material_name: "",
                    percent_by_mass: 0,
                    recoverable: true,
                  },
                ]
                setFormData({ ...formData, composition: newComp })
              }}
              className="w-full gap-2"
            >
              <MdAdd className="w-4 h-4" />
              Add Material
            </Button>
          </div>
        )}

        {/* Step 3: Waste Mapping (Scaffold) */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Waste mappings will be auto-generated based on composition materials. You can customize recycling methods
              and yields here.
            </p>
            <div className="p-4 bg-secondary rounded-lg text-center text-muted-foreground">
              Waste mapping editor coming soon...
            </div>
          </div>
        )}

        {/* Step 4: Safety & Metadata */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Flammability</Label>
                <Select
                  value={formData.safety_flags?.flammability || "low"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      safety_flags: { ...formData.safety_flags, flammability: value as any },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Toxicity</Label>
                <Select
                  value={formData.safety_flags?.toxicity || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      safety_flags: { ...formData.safety_flags, toxicity: value as any },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Usage Hint</Label>
              <Textarea
                value={formData.default_usage_hint || ""}
                onChange={(e) => setFormData({ ...formData, default_usage_hint: e.target.value })}
                placeholder="e.g., Single-use food storage, 1 pouch per meal"
              />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((t) => t.trim()),
                  })
                }
                placeholder="e.g., food, single-use, recyclable"
              />
            </div>
          </div>
        )}

        {/* Step 5: Review & Save */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <h3 className="font-semibold">{formData.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formData.category} • {formData.mass_per_unit_kg} kg per {formData.unit}
              </p>
              <p className="text-sm">
                {formData.composition?.length || 0} materials • {formData.waste_mappings?.length || 0} waste mappings
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Review your item details above. Click Save to add this item to the catalog.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back
          </Button>
          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Next
              <MdArrowForward className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave}>Save Item</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
