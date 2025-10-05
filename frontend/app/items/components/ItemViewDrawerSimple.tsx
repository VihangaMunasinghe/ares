"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ItemsCatalog } from "@/lib/api/global-entities"
import { cn } from "@/lib/utils"

interface ItemViewDrawerProps {
  item: ItemsCatalog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ItemViewDrawer({ item, open, onOpenChange }: ItemViewDrawerProps) {
  if (!item) return null

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      packaging: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      equipment: "bg-purple-500/20 text-purple-400 border-purple-500/50", 
      medical: "bg-red-500/20 text-red-400 border-red-500/50",
      consumable: "bg-green-500/20 text-green-400 border-green-500/50",
      structural: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      polymer: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      fabric: "bg-pink-500/20 text-pink-400 border-pink-500/50",
    }
    return colors[category] || "bg-secondary text-foreground"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{item.name}</SheetTitle>
          <SheetDescription>
            Item details from the global catalog
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {item.category.split(', ').map((cat, index) => (
                <Badge key={index} variant="outline" className={cn("border", getCategoryColor(cat.trim()))}>
                  {cat.trim()}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Unit</p>
                <p className="text-sm font-medium mt-1">{item.unit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mass per Unit</p>
                <p className="text-sm font-medium mt-1">{item.mass_per_unit ? `${item.mass_per_unit} kg` : 'N/A'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Composition */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Composition</h3>
            <div className="text-sm text-muted-foreground">
              {item.composition || 'No composition data'}
            </div>
          </div>

          <Separator />

          {/* Waste Mappings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Waste Mappings</h3>
            <div className="text-sm">
              <Badge variant="outline" className="font-mono">
                {item.waste_mappings} mapping{item.waste_mappings !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Safety Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Safety Information</h3>
            <div className="space-y-2">
              {Object.keys(item.safety).length > 0 ? (
                Object.entries(item.safety).map(([material, flags]: [string, any]) => (
                  <div key={material} className="text-sm">
                    <div className="font-medium">{material}</div>
                    <div className="flex gap-2 mt-1">
                      {flags?.flammable && (
                        <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                          🔥 Flammable
                        </Badge>
                      )}
                      {flags?.toxic && (
                        <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
                          ☠️ Toxic
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No safety information available</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Metadata</h3>
            <div className="text-sm text-muted-foreground">
              <p>Created: {new Date(item.created_at).toLocaleDateString()}</p>
              <p>ID: {item.id}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}