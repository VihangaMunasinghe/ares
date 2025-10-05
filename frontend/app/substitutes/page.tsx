"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading substitutes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Substitutes Catalog</h1>
        <p className="text-muted-foreground">
          Global substitute templates for mission planning and waste optimization
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search substitutes by name or key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <MdAdd className="w-4 h-4 mr-2" />
            Add Substitute
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground self-center">
          {filteredSubstitutes.length} substitutes
        </span>
      </div>

      {/* Substitutes Table */}
      <SubstitutesTable
        substitutes={filteredSubstitutes}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

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