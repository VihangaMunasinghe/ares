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
      <SheetContent className="w-[600px] overflow-y-auto border-border/50 bg-card/95 backdrop-blur-sm">
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-1 h-12 bg-gradient-to-b from-primary to-accent rounded-full flex-shrink-0"></div>
            <div className="space-y-2">
              <SheetTitle className="text-2xl font-technical tracking-wide text-left">
                {item.name}
              </SheetTitle>
              <SheetDescription className="font-technical text-xs uppercase tracking-wider text-muted-foreground text-left">
                Item Specification • Global Catalog • Sol 1247
              </SheetDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                {item.category.split(', ').map((cat, index) => (
                  <Badge key={index} variant="outline" className={cn("border font-technical text-xs", getCategoryColor(cat.trim()))}>
                    {cat.trim().toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-8 mt-6">
          {/* Physical Properties */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-0.5 h-5 bg-primary rounded-full"></div>
              <h3 className="text-sm font-technical tracking-wide uppercase text-muted-foreground">Physical Properties</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 pl-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Unit Type</p>
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <p className="text-sm font-technical font-medium">{item.unit}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Mass per Unit</p>
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <p className="text-sm font-mono font-medium">
                    {item.mass_per_unit ? `${item.mass_per_unit} kg` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Composition Analysis */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-0.5 h-5 bg-accent rounded-full"></div>
              <h3 className="text-sm font-technical tracking-wide uppercase text-muted-foreground">Composition Analysis</h3>
            </div>
            <div className="pl-4">
              <div className="p-4 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-sm font-technical leading-relaxed">
                  {item.composition || 'No composition data available'}
                </p>
              </div>
            </div>
          </div>

          {/* Resource Optimization */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-0.5 h-5 bg-green-400 rounded-full"></div>
              <h3 className="text-sm font-technical tracking-wide uppercase text-muted-foreground">Resource Optimization</h3>
            </div>
            <div className="pl-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-technical">Waste Mappings Configured</span>
                  <Badge variant="outline" className={cn(
                    "font-mono border text-sm",
                    item.waste_mappings > 0 
                      ? "border-green-500/50 text-green-400 bg-green-500/10" 
                      : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                  )}>
                    {item.waste_mappings}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-technical mt-2">
                  {item.waste_mappings > 0 
                    ? `${item.waste_mappings} waste stream mapping${item.waste_mappings !== 1 ? 's' : ''} configured for resource recovery`
                    : 'No waste mappings configured - optimization potential limited'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Safety Protocols */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-0.5 h-5 bg-red-400 rounded-full"></div>
              <h3 className="text-sm font-technical tracking-wide uppercase text-muted-foreground">Safety Protocols</h3>
            </div>
            <div className="pl-4">
              {Object.keys(item.safety).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(item.safety).map(([material, flags]: [string, any]) => (
                    <div key={material} className="p-4 bg-secondary/20 rounded-lg border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-technical font-medium">{material}</span>
                        <div className="flex gap-2">
                          {flags?.flammable && (
                            <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400 bg-orange-500/10 font-technical">
                              🔥 Flammable
                            </Badge>
                          )}
                          {flags?.toxic && (
                            <Badge variant="outline" className="text-xs border-red-500/50 text-red-400 bg-red-500/10 font-technical">
                              ☠️ Toxic
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-secondary/20 rounded-lg border border-border/30">
                  <p className="text-sm text-muted-foreground font-technical">
                    No safety hazards identified • Standard handling protocols apply
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-0.5 h-5 bg-cyan-400 rounded-full"></div>
              <h3 className="text-sm font-technical tracking-wide uppercase text-muted-foreground">System Information</h3>
            </div>
            <div className="pl-4">
              <div className="p-4 bg-secondary/20 rounded-lg border border-border/30 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm font-technical">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <div className="font-mono mt-1">{new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">System ID:</span>
                    <div className="font-mono mt-1">{item.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-technical border-t border-border/30 pt-3">
                  Mars Operations Catalog • Ares Mission Database • Classification: UNCLASSIFIED
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}