"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubstituteGlobalCreate, SubstituteGlobal, globalEntitiesApi } from '@/lib/api/global-entities'
import { useToast } from '@/hooks/use-toast'

interface SubstituteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  substitute?: SubstituteGlobal | null
  onSuccess?: () => void
}

export function SubstituteForm({ open, onOpenChange, substitute, onSuccess }: SubstituteFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<SubstituteGlobalCreate>({
    key: '',
    name: '',
    value_per_unit: 0,
    lifetime_weeks: 2,
  })

  const isEditing = !!substitute

  useEffect(() => {
    if (substitute) {
      setFormData({
        key: substitute.key,
        name: substitute.name,
        value_per_unit: substitute.value_per_unit,
        lifetime_weeks: substitute.lifetime_weeks,
      })
    } else {
      setFormData({
        key: '',
        name: '',
        value_per_unit: 0,
        lifetime_weeks: 2,
      })
    }
  }, [substitute])

  const handleInputChange = (field: keyof SubstituteGlobalCreate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing && substitute) {
        // TODO: Add update API when backend supports it
        toast({
          title: "Feature not available",
          description: "Substitute editing will be available when backend update API is implemented",
          variant: "destructive",
        })
      } else {
        await globalEntitiesApi.createSubstitute(formData)
        toast({
          title: "Success", 
          description: "Substitute created successfully",
        })
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} substitute`,
        variant: "destructive",
      })
      console.error('Error saving substitute:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Substitute' : 'Create New Substitute'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the substitute information below.' 
              : 'Fill in the information to create a new substitute.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="key" className="text-right">
                Key
              </Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleInputChange('key', e.target.value)}
                className="col-span-3"
                required
                disabled={isEditing} // Don't allow editing key for existing substitutes
                placeholder="unique-substitute-key"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="col-span-3"
                required
                placeholder="Substitute Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value_per_unit" className="text-right">
                Value/Unit
              </Label>
              <Input
                id="value_per_unit"
                type="number"
                step="0.01"
                min="0"
                value={formData.value_per_unit}
                onChange={(e) => handleInputChange('value_per_unit', parseFloat(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lifetime_weeks" className="text-right">
                Lifetime (weeks)
              </Label>
              <Input
                id="lifetime_weeks"
                type="number"
                min="1"
                value={formData.lifetime_weeks}
                onChange={(e) => handleInputChange('lifetime_weeks', parseInt(e.target.value) || 1)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Substitute' : 'Create Substitute')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}