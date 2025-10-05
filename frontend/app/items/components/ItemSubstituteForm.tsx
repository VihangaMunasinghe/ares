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
      <DialogContent className="sm:max-w-[500px] border-border/50 bg-card/95 backdrop-blur-sm">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-accent to-primary rounded-full"></div>
            <div>
              <DialogTitle className="font-technical tracking-wide text-lg">
                CREATE SUBSTITUTION LINK
              </DialogTitle>
              <DialogDescription className="font-technical text-xs uppercase tracking-wider text-muted-foreground">
                Establish item-substitute relationship • Resource optimization matrix
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-technical tracking-wide uppercase text-muted-foreground">
                Primary Item <span className="text-red-400">*</span>
              </Label>
              <Select 
                value={formData.item_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, item_id: value }))}
                disabled={loadingData}
              >
                <SelectTrigger className="bg-background/50 border-border/50 font-technical">
                  <SelectValue placeholder={loadingData ? "Loading items..." : "Select primary item to be replaced"} />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="font-technical">
                      <div className="flex flex-col items-start">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.category} • {item.unit}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground font-technical">
                The item that will be replaced in resource optimization scenarios
              </p>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                <span className="text-xs font-technical uppercase tracking-wider">Can be replaced by</span>
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-technical tracking-wide uppercase text-muted-foreground">
                Substitute Item <span className="text-red-400">*</span>
              </Label>
              <Select 
                value={formData.substitute_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, substitute_id: value }))}
                disabled={loadingData}
              >
                <SelectTrigger className="bg-background/50 border-border/50 font-technical">
                  <SelectValue placeholder={loadingData ? "Loading substitutes..." : "Select substitute item"} />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                  {substitutes.map((substitute) => (
                    <SelectItem key={substitute.id} value={substitute.id} className="font-technical">
                      <div className="flex flex-col items-start">
                        <span>{substitute.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Value: {substitute.value_per_unit} • Lifetime: {substitute.lifetime_weeks}w
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground font-technical">
                The substitute item that can replace the primary item
              </p>
            </div>

            {formData.item_id && formData.substitute_id && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h4 className="text-sm font-technical tracking-wide uppercase text-accent mb-2">
                  Relationship Preview
                </h4>
                <div className="space-y-1 text-sm font-technical">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primary:</span>
                    <span>{items.find(i => i.id === formData.item_id)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Substitute:</span>
                    <span>{substitutes.find(s => s.id === formData.substitute_id)?.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3 pt-4 border-t border-border/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="font-technical tracking-wide bg-transparent border-border/50 hover:bg-secondary/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingData || !formData.item_id || !formData.substitute_id}
              className="font-technical tracking-wide bg-accent hover:bg-accent/90"
            >
              {loading ? 'Creating Link...' : 'Create Relationship'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}