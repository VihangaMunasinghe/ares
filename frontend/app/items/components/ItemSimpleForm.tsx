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
import { ItemGlobalCreate, ItemsCatalog, globalEntitiesApi } from '@/lib/api/global-entities'
import { useToast } from '@/hooks/use-toast'

interface ItemSimpleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ItemsCatalog | null
  onSuccess?: () => void
}

export function ItemSimpleForm({ open, onOpenChange, item, onSuccess }: ItemSimpleFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ItemGlobalCreate>({
    key: '',
    name: '',
    units_label: 'unit',
    mass_per_unit: 1.0,
    lifetime_weeks: 1,
  })

  const isEditing = !!item

  useEffect(() => {
    if (item) {
      setFormData({
        key: item.id, // Using ID as key for editing
        name: item.name,
        units_label: item.unit,
        mass_per_unit: item.mass_per_unit || 1.0,
        lifetime_weeks: 1, // Default since this info isn't in ItemsCatalog
      })
    } else {
      setFormData({
        key: '',
        name: '',
        units_label: 'unit',
        mass_per_unit: 1.0,
        lifetime_weeks: 1,
      })
    }
  }, [item])

  const handleInputChange = (field: keyof ItemGlobalCreate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing && item) {
        await globalEntitiesApi.updateItem(item.id, formData)
        toast({
          title: "Success",
          description: "Item updated successfully",
        })
      } else {
        await globalEntitiesApi.createItem(formData)
        toast({
          title: "Success", 
          description: "Item created successfully",
        })
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} item`,
        variant: "destructive",
      })
      console.error('Error saving item:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Item' : 'Create New Item'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the item information below.' 
              : 'Fill in the information to create a new item.'}
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
                disabled={isEditing} // Don't allow editing key for existing items
                placeholder="unique-item-key"
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
                placeholder="Item Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="units_label" className="text-right">
                Unit
              </Label>
              <Input
                id="units_label"
                value={formData.units_label}
                onChange={(e) => handleInputChange('units_label', e.target.value)}
                className="col-span-3"
                required
                placeholder="unit, kg, pieces, etc."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mass_per_unit" className="text-right">
                Mass/Unit (kg)
              </Label>
              <Input
                id="mass_per_unit"
                type="number"
                step="0.001"
                min="0"
                value={formData.mass_per_unit}
                onChange={(e) => handleInputChange('mass_per_unit', parseFloat(e.target.value) || 0)}
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
              {loading ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}