"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MdEdit, MdContentCopy, MdDownload } from "react-icons/md"
import type { ItemTemplate } from "@/types/items"
import { cn } from "@/lib/utils"

interface ItemViewDrawerProps {
  item: ItemTemplate | null
  open: boolean
  onClose: () => void
  onEdit: (item: ItemTemplate) => void
  onDuplicate: (item: ItemTemplate) => void
}

export function ItemViewDrawer({ item, open, onClose, onEdit, onDuplicate }: ItemViewDrawerProps) {
  if (!item) return null

  const compositionSum = item.composition.reduce((sum, comp) => sum + comp.percent_by_mass, 0)

  const handleExport = () => {
    const dataStr = JSON.stringify(item, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${item.name.replace(/\s+/g, "-").toLowerCase()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{item.name}</SheetTitle>
          <SheetDescription>
            {item.manufacturer && `${item.manufacturer} • `}
            {item.sku && `SKU: ${item.sku}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <Badge variant="outline" className="mt-1">
                  {item.category}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit</p>
                <p className="text-sm font-medium mt-1">{item.unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mass per Unit</p>
                <p className="text-sm font-medium mt-1">{item.mass_per_unit_kg} kg</p>
              </div>
              {item.volume_per_unit_l && (
                <div>
                  <p className="text-xs text-muted-foreground">Volume per Unit</p>
                  <p className="text-sm font-medium mt-1">{item.volume_per_unit_l} L</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Composition */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Composition
              <span
                className={cn(
                  "ml-2 text-xs",
                  Math.abs(compositionSum - 100) < 0.01 ? "text-green-400" : "text-red-400",
                )}
              >
                (Total: {compositionSum.toFixed(1)}%)
              </span>
            </h3>
            <div className="space-y-2">
              {/* Visual bar */}
              <div className="h-8 flex rounded-lg overflow-hidden border border-border">
                {item.composition.map((comp, idx) => (
                  <div
                    key={comp.material_id}
                    className={cn(
                      "flex items-center justify-center text-xs font-semibold transition-all hover:brightness-110",
                      idx % 2 === 0 ? "bg-blue-500/40" : "bg-purple-500/40",
                    )}
                    style={{ width: `${comp.percent_by_mass}%` }}
                    title={`${comp.material_name}: ${comp.percent_by_mass}%`}
                  >
                    {comp.percent_by_mass > 10 && `${comp.percent_by_mass}%`}
                  </div>
                ))}
              </div>
              {/* List */}
              {item.composition.map((comp) => (
                <div key={comp.material_id} className="flex items-center justify-between p-2 bg-secondary rounded">
                  <span className="text-sm">{comp.material_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{comp.percent_by_mass}%</span>
                    {comp.recoverable && (
                      <Badge variant="outline" className="text-xs">
                        Recoverable
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Waste Mappings */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Waste Mappings & Recycling</h3>
            <div className="space-y-3">
              {item.waste_mappings.map((mapping) => (
                <div key={mapping.waste_id} className="p-3 bg-secondary rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{mapping.waste_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {mapping.recommended_methods.length} methods
                    </Badge>
                  </div>
                  <div className="space-y-1 pl-3">
                    {mapping.recommended_methods.map((method) => (
                      <div key={method.recipe_id} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>•</span>
                        <span>{method.method_name}</span>
                        {method.expected_yield && (
                          <span className="text-green-400">({(method.expected_yield * 100).toFixed(0)}% yield)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Flags */}
          {item.safety_flags && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Safety & Handling</h3>
                <div className="grid grid-cols-2 gap-3">
                  {item.safety_flags.flammability && (
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-xs text-muted-foreground">Flammability</p>
                      <p className="text-sm font-medium capitalize">{item.safety_flags.flammability}</p>
                    </div>
                  )}
                  {item.safety_flags.toxicity && (
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-xs text-muted-foreground">Toxicity</p>
                      <p className="text-sm font-medium capitalize">{item.safety_flags.toxicity}</p>
                    </div>
                  )}
                  {item.safety_flags.bio && (
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-xs text-muted-foreground">Biohazard</p>
                      <p className="text-sm font-medium text-red-400">Yes</p>
                    </div>
                  )}
                  {item.safety_flags.dust_hazard && (
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-xs text-muted-foreground">Dust Hazard</p>
                      <p className="text-sm font-medium text-yellow-400">Yes</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Usage Hint */}
          {item.default_usage_hint && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Usage Hint</h3>
                <p className="text-sm text-muted-foreground">{item.default_usage_hint}</p>
              </div>
            </>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={() => onEdit(item)} className="flex-1 gap-2">
              <MdEdit className="w-4 h-4" />
              Edit
            </Button>
            <Button onClick={() => onDuplicate(item)} variant="outline" className="flex-1 gap-2">
              <MdContentCopy className="w-4 h-4" />
              Duplicate
            </Button>
            <Button onClick={handleExport} variant="outline" className="gap-2 bg-transparent">
              <MdDownload className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
