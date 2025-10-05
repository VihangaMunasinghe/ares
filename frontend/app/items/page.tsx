"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    <div className="space-y-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Items Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Global item templates for mission planning and waste optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 bg-transparent">
            <MdFileDownload className="w-5 h-5" />
            Download Template
          </Button>
          {/* <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
            <MdUpload className="w-5 h-5" />
            Upload CSV/JSON
          </Button> */}
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-transparent">
            <MdDownload className="w-5 h-5" />
            Export Grid
          </Button>
          <Button
            onClick={() => setCreateFormOpen(true)}
            className="gap-2"
          >
            <MdAdd className="w-5 h-5" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search items by name, category, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{filteredItems.length}</strong> items
          </span>
          <span>•</span>
          <span>
            <strong className="text-foreground">{new Set(filteredItems.map((i) => i.category)).size}</strong> categories
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Items Catalog</TabsTrigger>
          <TabsTrigger value="substitutes">Item → Substitute Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Search & Stats for Items */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search items by name, category, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{filteredItems.length}</strong> items
              </span>
              <span>•</span>
              <span>
                <strong className="text-foreground">{new Set(filteredItems.map((i) => i.category)).size}</strong> categories
              </span>
            </div>
          </div>

          {/* Items Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading items catalog...</div>
            </div>
          ) : (
            <ItemsTable
              items={filteredItems}
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="substitutes" className="space-y-4">
          <ItemSubstitutesTable
            relationships={itemSubstitutes}
            onAdd={handleAddSubstituteRelationship}
            onDelete={handleDeleteSubstituteRelationship}
            loading={substitutesLoading}
          />
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
