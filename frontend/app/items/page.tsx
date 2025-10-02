"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MdAdd, MdUpload, MdDownload, MdFileDownload, MdSearch } from "react-icons/md"
import { ItemsTable } from "./components/ItemsTable"
import { ItemViewDrawer } from "./components/ItemViewDrawer"
import { ItemForm } from "./components/ItemForm"
import { UploadItems } from "./components/UploadItems"
import { mockItems } from "@/lib/mock-data/items"
import type { ItemTemplate } from "@/types/items"
import { useToast } from "@/hooks/use-toast"

export default function ItemsPage() {
  const [items, setItems] = useState<ItemTemplate[]>(mockItems)
  const [selectedItem, setSelectedItem] = useState<ItemTemplate | null>(null)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleView = (item: ItemTemplate) => {
    setSelectedItem(item)
    setViewDrawerOpen(true)
  }

  const handleEdit = (item: ItemTemplate) => {
    setEditingItem(item)
    setFormOpen(true)
    setViewDrawerOpen(false)
  }

  const handleDuplicate = (item: ItemTemplate) => {
    const duplicated = {
      ...item,
      id: `item-${Date.now()}`,
      name: `${item.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setItems([...items, duplicated])
    toast({
      title: "Item duplicated",
      description: `${item.name} has been duplicated successfully.`,
    })
  }

  const handleDelete = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId))
    toast({
      title: "Item deleted",
      description: "The item has been removed from the catalog.",
    })
  }

  const handleSave = (itemData: Partial<ItemTemplate>) => {
    if (editingItem) {
      // Update existing
      setItems(
        items.map((item) =>
          item.id === editingItem.id ? { ...item, ...itemData, updated_at: new Date().toISOString() } : item,
        ),
      )
      toast({
        title: "Item updated",
        description: `${itemData.name} has been updated successfully.`,
      })
    } else {
      // Create new
      const newItem: ItemTemplate = {
        id: `item-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...itemData,
      } as ItemTemplate
      setItems([...items, newItem])
      toast({
        title: "Item created",
        description: `${itemData.name} has been added to the catalog.`,
      })
    }
    setEditingItem(null)
  }

  const handleUpload = (uploadedItems: any[]) => {
    toast({
      title: "Items imported",
      description: `${uploadedItems.length} items have been imported successfully.`,
    })
  }

  const handleExportCSV = () => {
    const csv = [
      ["Name", "Category", "Unit", "Mass (kg)", "Composition", "Waste Mappings"].join(","),
      ...filteredItems.map((item) =>
        [
          item.name,
          item.category,
          item.unit,
          item.mass_per_unit_kg,
          item.composition.length,
          item.waste_mappings.length,
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
          <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
            <MdUpload className="w-5 h-5" />
            Upload CSV/JSON
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-transparent">
            <MdDownload className="w-5 h-5" />
            Export Grid
          </Button>
          <Button
            onClick={() => {
              setEditingItem(null)
              setFormOpen(true)
            }}
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

      {/* Table */}
      <ItemsTable
        items={filteredItems}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      {/* Modals & Drawers */}
      <ItemViewDrawer
        item={selectedItem}
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
      />

      <ItemForm item={editingItem} open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />

      <UploadItems open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>
  )
}
