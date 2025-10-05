"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MdAdd, MdSearch } from "react-icons/md"
import { SubstitutesTable } from "./components/SubstitutesTable"
import { SubstituteForm } from "./components/SubstituteForm"
import { globalEntitiesApi, SubstituteGlobal } from '@/lib/api/global-entities'
import { useToast } from '@/hooks/use-toast'

export default function SubstitutesPage() {
  const { toast } = useToast()
  const [substitutes, setSubstitutes] = useState<SubstituteGlobal[]>([])
  const [filteredSubstitutes, setFilteredSubstitutes] = useState<SubstituteGlobal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingSubstitute, setEditingSubstitute] = useState<SubstituteGlobal | null>(null)

  // Load substitutes from API
  const loadSubstitutes = async () => {
    try {
      setLoading(true)
      const substitutesData = await globalEntitiesApi.getSubstitutes()
      setSubstitutes(substitutesData)
    } catch (error) {
      console.error('Error loading substitutes:', error)
      toast({
        title: "Error",
        description: "Failed to load substitutes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubstitutes()
  }, [])

  // Filter substitutes based on search
  useEffect(() => {
    let filtered = substitutes
    
    if (searchTerm) {
      filtered = filtered.filter(substitute =>
        substitute.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        substitute.key.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredSubstitutes(filtered)
  }, [substitutes, searchTerm])

  const handleView = (substitute: SubstituteGlobal) => {
    // For now, just show basic info in toast
    toast({
      title: substitute.name,
      description: `Key: ${substitute.key} | Value: ${substitute.value_per_unit} | Lifetime: ${substitute.lifetime_weeks} weeks`,
    })
  }

  const handleEdit = (substitute: SubstituteGlobal) => {
    setEditingSubstitute(substitute)
    setShowEditForm(true)
  }

  const handleDuplicate = async (substitute: SubstituteGlobal) => {
    try {
      const duplicatedSubstitute = {
        key: `${substitute.key}-copy-${Date.now()}`,
        name: `${substitute.name} (Copy)`,
        value_per_unit: substitute.value_per_unit,
        lifetime_weeks: substitute.lifetime_weeks
      }
      await globalEntitiesApi.createSubstitute(duplicatedSubstitute)
      toast({
        title: "Success",
        description: "Substitute duplicated successfully",
      })
      loadSubstitutes() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate substitute",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (substituteId: string) => {
    if (!window.confirm("Are you sure you want to delete this substitute?")) {
      return
    }

    try {
      await globalEntitiesApi.deleteSubstitute(substituteId)
      toast({
        title: "Success",
        description: "Substitute deleted successfully",
      })
      loadSubstitutes() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete substitute",
        variant: "destructive",
      })
    }
  }

  const handleFormSuccess = () => {
    loadSubstitutes() // Refresh the list after create/update
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header with NASA-style typography */}
        <div className="relative">
          <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4 font-technical">SUBSTITUTES CATALOG</h1>
          <p className="text-muted-foreground mt-2 font-technical tracking-wide">
            Global substitute templates for mission planning and waste optimization • Sol {new Date().getFullYear() - 2020 + 1}
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
              </div>
              <p className="text-muted-foreground font-technical">Loading substitutes catalog...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with NASA-style typography */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4 font-technical">SUBSTITUTES CATALOG</h1>
        <p className="text-muted-foreground mt-2 font-technical tracking-wide">
          Global substitute templates for mission planning and waste optimization • Sol {new Date().getFullYear() - 2020 + 1}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search substitutes by name or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-technical">
            <span>
              <strong className="text-foreground">{filteredSubstitutes.length}</strong> substitutes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gap-2"
            >
              <MdAdd className="w-4 h-4" />
              Add Substitute
            </Button>
          </div>
        </div>
      </div>

      {/* Substitutes Table Card */}
      {loading ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
              </div>
              <p className="text-muted-foreground font-technical">Loading substitutes catalog...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-technical tracking-wide">SUBSTITUTION MATRIX</CardTitle>
                <CardDescription className="font-technical text-xs tracking-wider uppercase">Global substitutes database • Mars operations</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-technical text-green-400">LIVE</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SubstitutesTable
              substitutes={filteredSubstitutes}
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Form Dialog */}
      <SubstituteForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Form Dialog */}
      <SubstituteForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        substitute={editingSubstitute}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}