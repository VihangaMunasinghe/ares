"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MdSearch, MdAdd, MdVisibility, MdEdit, MdDelete, MdWarning } from "react-icons/md"
import type { Mission } from "@/lib/api/missions"
import type { ItemTemplate } from "@/types/items"
import { toast } from "@/hooks/use-toast"

interface MissionItemsManagerProps {
  mission: Mission
}

// Mock data for demonstration - replace with actual API calls
const mockItems: ItemTemplate[] = [
  {
    id: "1",
    name: "Water Recycling Filter",
    category: "equipment",
    unit: "piece",
    mass_per_unit_kg: 2.5,
    composition: [
      { material_id: "1", material_name: "Plastic", percent_by_mass: 60, recoverable: true },
      { material_id: "2", material_name: "Metal", percent_by_mass: 40, recoverable: true }
    ],
    waste_mappings: [
      {
        material_id: "1",
        waste_id: "w1",
        waste_name: "Plastic Waste",
        recommended_methods: []
      }
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2", 
    name: "Food Package",
    category: "consumable",
    unit: "piece",
    mass_per_unit_kg: 0.5,
    composition: [
      { material_id: "3", material_name: "Organic", percent_by_mass: 70, recoverable: false },
      { material_id: "1", material_name: "Plastic", percent_by_mass: 30, recoverable: true }
    ],
    waste_mappings: [
      {
        material_id: "1",
        waste_id: "w1", 
        waste_name: "Plastic Waste",
        recommended_methods: []
      }
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
]

export function MissionItemsManager({ mission }: MissionItemsManagerProps) {
  const [items, setItems] = useState<ItemTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ItemTemplate | null>(null)

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      packaging: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      equipment: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      medical: "bg-red-500/20 text-red-400 border-red-500/50",
      consumable: "bg-green-500/20 text-green-400 border-green-500/50",
      structural: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    }
    return colors[category] || "bg-secondary text-foreground"
  }

  const hasValidationIssues = (item: ItemTemplate) => {
    const compositionSum = item.composition.reduce((sum, comp) => sum + comp.percent_by_mass, 0)
    return Math.abs(compositionSum - 100) > 0.01 || item.waste_mappings.length === 0
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Simulate loading items for the mission
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setItems(mockItems)
      setLoading(false)
    }
    loadItems()
  }, [mission.id])

  const handleAddNewItem = () => {
    // TODO: Implement add new item functionality
    toast({
      title: "Add New Item",
      description: "Add new item functionality will be implemented here",
    })
  }

  const handleViewItem = (item: ItemTemplate) => {
    setSelectedItem(item)
  }

  const handleEditItem = (item: ItemTemplate) => {
    // TODO: Implement edit item functionality
    toast({
      title: "Edit Item",
      description: `Edit functionality for ${item.name} will be implemented here`,
    })
  }

  const handleDeleteItem = (itemId: string) => {
    // TODO: Implement delete item functionality
    toast({
      title: "Delete Item",
      description: "Delete functionality will be implemented here",
      variant: "destructive",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mission Items</CardTitle>
          <CardDescription>Loading items for {mission.name}...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-muted-foreground">Loading mission items...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mission Items</CardTitle>
        <CardDescription>Search and manage items for {mission.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Add controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search items by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleAddNewItem} className="gap-2">
            <MdAdd className="w-4 h-4" />
            Add New Item
          </Button>
        </div>

        {/* Items Table */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No items found matching your search." : "No items added to this mission yet."}
            </p>
            <Button onClick={handleAddNewItem} className="gap-2">
              <MdAdd className="w-4 h-4" />
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Unit</TableHead>
                  <TableHead className="font-semibold text-right">Mass/Unit (kg)</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {hasValidationIssues(item) && (
                          <MdWarning className="w-4 h-4 text-yellow-500" />
                        )}
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getCategoryColor(item.category)}
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.mass_per_unit_kg.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewItem(item)}
                          className="h-8 w-8 p-0"
                        >
                          <MdVisibility className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8 p-0"
                        >
                          <MdEdit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <MdDelete className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Item Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>Item details and composition</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Badge className={getCategoryColor(selectedItem.category)} variant="outline">
                    {selectedItem.category}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Mass per unit</label>
                  <p className="text-sm">{selectedItem.mass_per_unit_kg} kg per {selectedItem.unit}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Composition</label>
                <div className="space-y-1">
                  {selectedItem.composition.map((comp, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{comp.material_name}</span>
                      <span>{comp.percent_by_mass}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}