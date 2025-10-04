"use client"

import { useState, type FormEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MdSave, MdCancel } from "react-icons/md"
import { missionsApi, type Mission, type MissionCreate } from "@/lib/api/missions"
import { toast } from "@/hooks/use-toast"

interface MissionCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMissionCreated: (mission: Mission) => void
}

export function MissionCreateDialog({ open, onOpenChange, onMissionCreated }: MissionCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<MissionCreate>({
    name: "",
    description: "",
    mission_start_date: null,
    duration_weeks: 1,
    transit_weeks: 0,
    surface_weeks: 0,
    return_weeks: 0,
    crew_count: 0,
    crew_hours_per_week: 0,
    printer_capacity_kg_per_week: 0,
    tools_available: [],
    status: "Planned",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const availableTools = [
    "extruder",
    "3d-printer",
    "3d-printer-large", 
    "press",
    "grinder",
    "lathe",
    "welder",
    "cnc-mill",
    "laser-cutter",
    "oven",
    "sealer",
  ]

  const statusOptions = ["Planned", "Running", "Completed", "Archived"] as const

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      mission_start_date: null,
      duration_weeks: 1,
      transit_weeks: 0,
      surface_weeks: 0,
      return_weeks: 0,
      crew_count: 0,
      crew_hours_per_week: 0,
      printer_capacity_kg_per_week: 0,
      tools_available: [],
      status: "Planned",
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Mission name is required"
    }

    if (formData.duration_weeks <= 0) {
      newErrors.duration_weeks = "Duration must be greater than 0"
    }

    const totalPhases = formData.transit_weeks + formData.surface_weeks + formData.return_weeks
    if (totalPhases !== formData.duration_weeks) {
      newErrors.phases = `Transit + Surface + Return must equal Duration (${formData.duration_weeks}w). Current total: ${totalPhases}w`
    }

    if (formData.crew_count < 0) {
      newErrors.crew_count = "Crew count cannot be negative"
    }

    if (formData.crew_hours_per_week < 0) {
      newErrors.crew_hours_per_week = "Crew hours cannot be negative"
    }

    if (formData.printer_capacity_kg_per_week < 0) {
      newErrors.printer_capacity_kg_per_week = "Printer capacity cannot be negative"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const mission = await missionsApi.createMission(formData)
      toast({
        title: "Success",
        description: "Mission created successfully",
      })
      onMissionCreated(mission)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mission'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToolToggle = (tool: string) => {
    setFormData((prev) => ({
      ...prev,
      tools_available: prev.tools_available.includes(tool)
        ? prev.tools_available.filter((t) => t !== tool)
        : [...prev.tools_available, tool],
    }))
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Mission</DialogTitle>
          <DialogDescription>
            Create a new Mars mission with detailed specifications and requirements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission Information</CardTitle>
              <CardDescription>Basic mission details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Mission Name *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ares III"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <textarea
                  id="create-description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                  placeholder="Mission objectives and details..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-mission_start_date">Mission Start Date</Label>
                <Input
                  id="create-mission_start_date"
                  type="date"
                  value={formData.mission_start_date || ""}
                  onChange={(e) => setFormData({ ...formData, mission_start_date: e.target.value || null })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-status">Status</Label>
                <Select
                  value={formData.status || "Planned"}
                  onValueChange={(value) => setFormData({ ...formData, status: value as typeof statusOptions[number] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mission Duration</CardTitle>
              <CardDescription>All durations in weeks. Transit + Surface + Return must equal Duration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-duration_weeks">Total Duration (weeks) *</Label>
                  <Input
                    id="create-duration_weeks"
                    type="number"
                    min="1"
                    value={formData.duration_weeks || ""}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: Number.parseInt(e.target.value) || 1 })}
                    aria-invalid={!!errors.duration_weeks}
                  />
                  {errors.duration_weeks && <p className="text-sm text-destructive">{errors.duration_weeks}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-transit_weeks">Transit (weeks)</Label>
                  <Input
                    id="create-transit_weeks"
                    type="number"
                    min="0"
                    value={formData.transit_weeks || ""}
                    onChange={(e) => setFormData({ ...formData, transit_weeks: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-surface_weeks">Surface (weeks)</Label>
                  <Input
                    id="create-surface_weeks"
                    type="number"
                    min="0"
                    value={formData.surface_weeks || ""}
                    onChange={(e) => setFormData({ ...formData, surface_weeks: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-return_weeks">Return (weeks)</Label>
                  <Input
                    id="create-return_weeks"
                    type="number"
                    min="0"
                    value={formData.return_weeks || ""}
                    onChange={(e) => setFormData({ ...formData, return_weeks: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {errors.phases && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{errors.phases}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crew & Resources</CardTitle>
              <CardDescription>Crew size and resource constraints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-crew_count">Crew Count</Label>
                  <Input
                    id="create-crew_count"
                    type="number"
                    min="0"
                    value={formData.crew_count || ""}
                    onChange={(e) => setFormData({ ...formData, crew_count: Number.parseInt(e.target.value) || 0 })}
                    aria-invalid={!!errors.crew_count}
                  />
                  {errors.crew_count && <p className="text-sm text-destructive">{errors.crew_count}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-crew_hours_per_week">Crew Hours per Week</Label>
                  <Input
                    id="create-crew_hours_per_week"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.crew_hours_per_week || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, crew_hours_per_week: Number.parseFloat(e.target.value) || 0 })
                    }
                    aria-invalid={!!errors.crew_hours_per_week}
                  />
                  {errors.crew_hours_per_week && <p className="text-sm text-destructive">{errors.crew_hours_per_week}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-printer_capacity_kg_per_week">Printer Capacity (kg/week)</Label>
                  <Input
                    id="create-printer_capacity_kg_per_week"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.printer_capacity_kg_per_week || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, printer_capacity_kg_per_week: Number.parseFloat(e.target.value) || 0 })
                    }
                    aria-invalid={!!errors.printer_capacity_kg_per_week}
                  />
                  {errors.printer_capacity_kg_per_week && (
                    <p className="text-sm text-destructive">{errors.printer_capacity_kg_per_week}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tools Available</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableTools.map((tool) => (
                    <label
                      key={tool}
                      className="flex items-center gap-2 p-2 rounded-md border border-input hover:bg-accent cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.tools_available.includes(tool)}
                        onChange={() => handleToolToggle(tool)}
                        className="rounded border-input"
                      />
                      <span className="text-sm capitalize">{tool.replace(/-/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <MdCancel className="w-4 h-4" />
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={isSubmitting}>
              <MdSave className="w-4 h-4" />
              {isSubmitting ? "Creating..." : "Create Mission"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
