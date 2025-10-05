"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MdAdd, MdUpload, MdDownload, MdFileDownload, MdSearch } from "react-icons/md"
import { ItemsTable } from "./components/ItemsTable"
import { ItemViewDrawer } from "./components/ItemViewDrawerSimple"
import { ItemSimpleForm } from "./components/ItemSimpleForm"
import { ItemSubstitutesTable } from "./components/ItemSubstitutesTable"
import { ItemSubstituteForm } from "./components/ItemSubstituteForm"
// import { ItemForm } from "./components/ItemForm"
// import { UploadItems } from "./components/UploadItems"
import { globalEntitiesApi, type ItemsCatalog, type ItemSubstituteRelationship } from "@/lib/api/global-entities"
import { useToast } from "@/hooks/use-toast"

export default function ItemsPage() {
  const [items, setItems] = useState<ItemsCatalog[]>([])
  const [itemSubstitutes, setItemSubstitutes] = useState<ItemSubstituteRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [substitutesLoading, setSubstitutesLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemsCatalog | null>(null)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [editFormOpen, setEditFormOpen] = useState(false)
  const [substituteFormOpen, setSubstituteFormOpen] = useState(false)
  // const [uploadOpen, setUploadOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemsCatalog | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("items")
  const { toast } = useToast()

  // Load items from API
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        const itemsData = await globalEntitiesApi.getItemsCatalog()
        setItems(itemsData)
      } catch (error) {
        console.error("Error loading items:", error)
        toast({
          title: "Error",
          description: "Failed to load items catalog. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [])

  // Load item-substitute relationships
  const loadItemSubstitutes = async () => {
    try {
      setSubstitutesLoading(true)
      const relationshipsData = await globalEntitiesApi.getItemSubstituteRelationships()
      setItemSubstitutes(relationshipsData)
    } catch (error) {
      console.error("Error loading item-substitute relationships:", error)
      toast({
        title: "Error",
        description: "Failed to load item-substitute relationships.",
        variant: "destructive",
      })
    } finally {
      setSubstitutesLoading(false)
    }
  }

  // Load item-substitutes when switching to that tab
  useEffect(() => {
    if (activeTab === "substitutes") {
      loadItemSubstitutes()
    }
  }, [activeTab])

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleView = (item: ItemsCatalog) => {
    setSelectedItem(item)
    setViewDrawerOpen(true)
  }

  const handleEdit = (item: ItemsCatalog) => {
    setEditingItem(item)
    setEditFormOpen(true)
    setViewDrawerOpen(false)
  }

  const handleDuplicate = async (item: ItemsCatalog) => {
    try {
      const duplicatedItem = {
        key: `${item.id}-copy-${Date.now()}`,
        name: `${item.name} (Copy)`,
        units_label: item.unit,
        mass_per_unit: item.mass_per_unit || 1.0,
        lifetime_weeks: 1
      }
      await globalEntitiesApi.createItem(duplicatedItem)
      // Reload items to show the new one
      const itemsData = await globalEntitiesApi.getItemsCatalog()
      setItems(itemsData)
      toast({
        title: "Item duplicated",
        description: "The item has been duplicated successfully.",
      })
    } catch (error) {
      console.error("Error duplicating item:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await globalEntitiesApi.deleteItem(itemId)
      // Remove from local state
      setItems(items.filter((item) => item.id !== itemId))
      toast({
        title: "Item deleted",
        description: "The item has been removed from the catalog.",
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFormSuccess = async () => {
    // Reload items after create/update
    try {
      const itemsData = await globalEntitiesApi.getItemsCatalog()
      setItems(itemsData)
    } catch (error) {
      console.error("Error reloading items:", error)
    }
  }

  // Item-Substitute handlers
  const handleAddSubstituteRelationship = () => {
    setSubstituteFormOpen(true)
  }

  const handleDeleteSubstituteRelationship = async (relationshipId: string) => {
    if (!window.confirm("Are you sure you want to delete this relationship?")) {
      return
    }

    try {
      await globalEntitiesApi.deleteItemSubstituteRelationship(relationshipId)
      toast({
        title: "Success",
        description: "Relationship deleted successfully",
      })
      loadItemSubstitutes() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete relationship",
        variant: "destructive",
      })
    }
  }

  const handleSubstituteFormSuccess = () => {
    loadItemSubstitutes() // Refresh the list after create
  }

  const handleExportCSV = () => {
    const csv = [
      ["Name", "Category", "Unit", "Mass (kg)", "Composition", "Waste Mappings"].join(","),
      ...filteredItems.map((item) =>
        [
          item.name,
          item.category,
          item.unit,
          item.mass_per_unit || 0,
          `"${item.composition}"`, // Wrap composition in quotes since it may contain commas
          item.waste_mappings,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "items-catalog.csv"
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export complete",
      description: "Items catalog has been exported to CSV.",
    })
  }

  const handleDownloadTemplate = () => {
    const template = `name,category,unit,mass_per_unit_kg,manufacturer,sku
Food Packaging Pouch,packaging,unit,0.025,SpaceFood Inc.,SFI-PKG-001
Water Filter Cartridge,equipment,unit,1.2,AquaMars Systems,AMS-FLT-205`

    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "items-template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header with NASA-style typography */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4 font-technical">ITEMS CATALOG</h1>
        <p className="text-muted-foreground mt-2 font-technical tracking-wide">
          Global item templates for mission planning and waste optimization • Sol 1247
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search items by name, category, or composition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-technical">
            <span>
              <strong className="text-foreground">{filteredItems.length}</strong> items
            </span>
            <span>•</span>
            <span>
              <strong className="text-foreground">{new Set(filteredItems.map((i) => i.category)).size}</strong> categories
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 bg-transparent">
              <MdFileDownload className="w-4 h-4" />
              Template
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-transparent">
              <MdDownload className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => setCreateFormOpen(true)}
              className="gap-2"
            >
              <MdAdd className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items" className="font-technical">Items Catalog</TabsTrigger>
          <TabsTrigger value="substitutes" className="font-technical">Item → Substitute Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Items Table Card */}
          {loading ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
                  </div>
                  <p className="text-muted-foreground font-technical">Loading items catalog...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-technical tracking-wide">CATALOG INVENTORY</CardTitle>
                    <CardDescription className="font-technical text-xs tracking-wider uppercase">Global items database • Mars operations</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-technical text-green-400">LIVE</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ItemsTable
                  items={filteredItems}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="substitutes" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-technical tracking-wide">SUBSTITUTION MATRIX</CardTitle>
                  <CardDescription className="font-technical text-xs tracking-wider uppercase">Item replacement relationships • Resource optimization</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span className="text-xs font-technical text-accent">ACTIVE</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ItemSubstitutesTable
                relationships={itemSubstitutes}
                onAdd={handleAddSubstituteRelationship}
                onDelete={handleDeleteSubstituteRelationship}
                loading={substitutesLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals & Drawers */}
      <ItemViewDrawer
        item={selectedItem}
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
      />

      <ItemSimpleForm
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        onSuccess={handleFormSuccess}
      />

      <ItemSimpleForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />

      {/* Item-Substitute Form */}
      <ItemSubstituteForm
        open={substituteFormOpen}
        onOpenChange={setSubstituteFormOpen}
        onSuccess={handleSubstituteFormSuccess}
      />

      {/* Temporarily disabled complex forms
      <ItemForm item={editingItem} open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
      <UploadItems open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      */}
    </div>
  )
}
