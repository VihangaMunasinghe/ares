"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { MdAdd, MdEdit, MdClose } from 'react-icons/md'

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
      <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-sm border-accent/20">
        {/* NASA-style Header */}
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                {isEditing ? <MdEdit className="w-5 h-5 text-white" /> : <MdAdd className="w-5 h-5 text-white" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-technical font-bold uppercase tracking-wider">
                  {isEditing ? 'MODIFY SUBSTITUTE' : 'CREATE SUBSTITUTE'}
                </DialogTitle>
                <Badge variant="outline" className="border-accent/50 text-accent font-technical text-xs mt-1">
                  SOL {new Date().getFullYear() - 2020 + 1}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <MdClose className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="font-technical text-sm text-muted-foreground uppercase tracking-wider">
            {isEditing ? 'Update resource substitution parameters' : 'Configure new substitution matrix entry'}
          </DialogDescription>
          <div className="h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matrix Key */}
            <div className="space-y-3">
              <Label htmlFor="key" className="font-technical text-sm uppercase tracking-wider text-foreground">
                Matrix Key
                <span className="text-accent ml-1">*</span>
              </Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleInputChange('key', e.target.value)}
                placeholder="MATRIX_KEY_IDENTIFIER..."
                required
                disabled={isEditing}
                className="font-mono bg-background/50 border-accent/20 focus:border-accent disabled:opacity-60"
              />
              <p className="text-xs font-technical text-muted-foreground uppercase tracking-wider">
                {isEditing ? 'Matrix key cannot be modified' : 'Unique system identifier for substitution mapping'}
              </p>
            </div>

            {/* Resource Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="font-technical text-sm uppercase tracking-wider text-foreground">
                Resource Name
                <span className="text-accent ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="ENTER RESOURCE NAME..."
                required
                className="font-technical bg-background/50 border-accent/20 focus:border-accent"
              />
              <p className="text-xs font-technical text-muted-foreground uppercase tracking-wider">
                Human-readable identifier for resource
              </p>
            </div>

            {/* Value Per Unit */}
            <div className="space-y-3">
              <Label htmlFor="value_per_unit" className="font-technical text-sm uppercase tracking-wider text-foreground">
                Value/Unit
                <span className="text-accent ml-1">*</span>
              </Label>
              <Input
                id="value_per_unit"
                type="number"
                step="0.01"
                min="0"
                value={formData.value_per_unit}
                onChange={(e) => handleInputChange('value_per_unit', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
                className="font-technical bg-background/50 border-accent/20 focus:border-accent"
              />
              <p className="text-xs font-technical text-muted-foreground uppercase tracking-wider">
                Nutritional or functional value coefficient
              </p>
            </div>

            {/* Lifetime Weeks */}
            <div className="space-y-3">
              <Label htmlFor="lifetime_weeks" className="font-technical text-sm uppercase tracking-wider text-foreground">
                Lifetime (Weeks)
                <span className="text-accent ml-1">*</span>
              </Label>
              <Input
                id="lifetime_weeks"
                type="number"
                min="1"
                value={formData.lifetime_weeks}
                onChange={(e) => handleInputChange('lifetime_weeks', parseInt(e.target.value) || 1)}
                placeholder="1"
                required
                className="font-technical bg-background/50 border-accent/20 focus:border-accent"
              />
              <p className="text-xs font-technical text-muted-foreground uppercase tracking-wider">
                Expected resource viability duration
              </p>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20 rounded-lg p-4">
            <h4 className="font-technical text-sm uppercase tracking-wider text-foreground mb-3">Configuration Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-technical text-muted-foreground uppercase tracking-wider">Resource:</span>
                <div className="font-technical font-medium">{formData.name || 'Unnamed Resource'}</div>
              </div>
              <div>
                <span className="font-technical text-muted-foreground uppercase tracking-wider">Matrix Key:</span>
                <div className="font-mono text-accent">{formData.key || 'undefined'}</div>
              </div>
              <div>
                <span className="font-technical text-muted-foreground uppercase tracking-wider">Value/Unit:</span>
                <div className="font-technical">{(formData.value_per_unit || 0).toFixed(2)}</div>
              </div>
              <div>
                <span className="font-technical text-muted-foreground uppercase tracking-wider">Lifetime:</span>
                <div className="font-technical">{formData.lifetime_weeks} weeks</div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t border-accent/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-technical border-accent/20 hover:border-accent/40"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-accent to-primary hover:from-accent/80 hover:to-primary/80 font-technical tracking-wider"
            >
              {loading ? 'PROCESSING...' : (isEditing ? 'UPDATE SUBSTITUTE' : 'CREATE SUBSTITUTE')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}