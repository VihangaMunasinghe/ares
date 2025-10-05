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
      <DialogContent className="sm:max-w-[500px] border-border/50 bg-card/95 backdrop-blur-sm">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <div>
              <DialogTitle className="font-technical tracking-wide text-lg">
                {isEditing ? 'EDIT ITEM' : 'CREATE NEW ITEM'}
              </DialogTitle>
              <DialogDescription className="font-technical text-xs uppercase tracking-wider text-muted-foreground">
                {isEditing 
                  ? 'Update item specifications • Mars operations catalog' 
                  : 'Add new item to global catalog • Mission resource management'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key" className="text-sm font-technical tracking-wide uppercase text-muted-foreground">
                Item Key <span className="text-red-400">*</span>
              </Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleInputChange('key', e.target.value)}
                className="bg-background/50 border-border/50 font-technical"
                required
                disabled={isEditing}
                placeholder="unique-item-identifier"
              />
              {isEditing && (
                <p className="text-xs text-muted-foreground font-technical">
                  Key cannot be modified for existing items
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-technical tracking-wide uppercase text-muted-foreground">
                Item Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-background/50 border-border/50 font-technical"
                required
                placeholder="Enter descriptive item name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units_label" className="text-sm font-technical tracking-wide uppercase text-muted-foreground">
                  Unit Type <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="units_label"
                  value={formData.units_label}
                  onChange={(e) => handleInputChange('units_label', e.target.value)}
                  className="bg-background/50 border-border/50 font-technical"
                  required
                  placeholder="unit, kg, pieces"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mass_per_unit" className="text-sm font-technical tracking-wide uppercase text-muted-foreground">
                  Mass/Unit (kg) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="mass_per_unit"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.mass_per_unit}
                  onChange={(e) => handleInputChange('mass_per_unit', parseFloat(e.target.value) || 0)}
                  className="bg-background/50 border-border/50 font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifetime_weeks" className="text-sm font-technical tracking-wide uppercase text-muted-foreground">
                Lifetime (weeks) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="lifetime_weeks"
                type="number"
                min="1"
                value={formData.lifetime_weeks}
                onChange={(e) => handleInputChange('lifetime_weeks', parseInt(e.target.value) || 1)}
                className="bg-background/50 border-border/50 font-mono"
                required
              />
              <p className="text-xs text-muted-foreground font-technical">
                Expected operational lifetime for mission planning
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-4 border-t border-border/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="font-technical tracking-wide bg-transparent border-border/50 hover:bg-secondary/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="font-technical tracking-wide bg-primary hover:bg-primary/90"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}