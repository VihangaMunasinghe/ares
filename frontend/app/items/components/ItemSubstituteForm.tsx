"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ItemSubstituteCreate, globalEntitiesApi, ItemsCatalog, SubstituteGlobal } from '@/lib/api/global-entities'
import { useToast } from '@/hooks/use-toast'

interface ItemSubstituteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ItemSubstituteForm({ open, onOpenChange, onSuccess }: ItemSubstituteFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [items, setItems] = useState<ItemsCatalog[]>([])
  const [substitutes, setSubstitutes] = useState<SubstituteGlobal[]>([])
  const [formData, setFormData] = useState<ItemSubstituteCreate>({
    item_id: '',
    substitute_id: '',
  })

  // Load items and substitutes when dialog opens
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const [itemsData, substitutesData] = await Promise.all([
        globalEntitiesApi.getItemsCatalog(),
        globalEntitiesApi.getSubstitutes()
      ])
      setItems(itemsData)
      setSubstitutes(substitutesData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load items and substitutes",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.item_id || !formData.substitute_id) {
      toast({
        title: "Validation Error",
        description: "Please select both an item and a substitute",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await globalEntitiesApi.createItemSubstituteRelationship(formData)
      toast({
        title: "Success", 
        description: "Item-substitute relationship created successfully",
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create relationship. It may already exist.",
        variant: "destructive",
      })
      console.error('Error creating relationship:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({ item_id: '', substitute_id: '' })
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Item-Substitute Relationship</DialogTitle>
          <DialogDescription>
            Select an item and a substitute that can replace it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item" className="text-right">
                Item
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.item_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, item_id: value }))}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading items..." : "Select an item"} />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="substitute" className="text-right">
                Substitute
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.substitute_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, substitute_id: value }))}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading substitutes..." : "Select a substitute"} />
                  </SelectTrigger>
                  <SelectContent>
                    {substitutes.map((substitute) => (
                      <SelectItem key={substitute.id} value={substitute.id}>
                        {substitute.name} (Value: {substitute.value_per_unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingData || !formData.item_id || !formData.substitute_id}>
              {loading ? 'Creating...' : 'Create Relationship'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}