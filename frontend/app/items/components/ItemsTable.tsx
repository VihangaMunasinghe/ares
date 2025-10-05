"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MdVisibility, MdEdit, MdContentCopy, MdDelete, MdWarning } from "react-icons/md"
import type { ItemsCatalog } from "@/lib/api/global-entities"
import { cn } from "@/lib/utils"

interface ItemsTableProps {
  items: ItemsCatalog[]
  onView: (item: ItemsCatalog) => void
  onEdit: (item: ItemsCatalog) => void
  onDuplicate: (item: ItemsCatalog) => void
  onDelete: (itemId: string) => void
}

export function ItemsTable({ items, onView, onEdit, onDuplicate, onDelete }: ItemsTableProps) {
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

  const hasValidationIssues = (item: ItemsCatalog) => {
    // For now, just check if waste mappings exist
    return item.waste_mappings === 0
  }

  const renderSafetyFlags = (safetyData: Record<string, any>) => {
    const flags: React.ReactElement[] = []
    
    // Iterate through all materials in the safety object
    Object.values(safetyData).forEach((materialSafety: any, index) => {
      if (materialSafety?.flammable) {
        flags.push(
          <Badge key={`fire-${index}`} variant="outline" className="text-xs border-orange-500/50 text-orange-400">
            🔥
          </Badge>
        )
      }
      if (materialSafety?.toxic) {
        flags.push(
          <Badge key={`toxic-${index}`} variant="outline" className="text-xs border-red-500/50 text-red-400">
            ☠️
          </Badge>
        )
      }
    })
    
    return flags
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-technical">No items found matching your search criteria</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 border-b border-border/50">
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Name</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Category</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Unit</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-right">Mass/Unit (kg)</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Composition</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-center">Waste Mappings</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Safety</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-secondary/30 transition-all duration-200 border-b border-border/20"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {hasValidationIssues(item) && (
                        <MdWarning className="w-4 h-4 text-yellow-400" title="Validation issues" />
                      )}
                      <div>
                        <span className="font-technical">{item.name}</span>
                        <div className="text-xs text-muted-foreground font-technical mt-1">
                          ID: {item.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.category.split(', ').map((cat, index) => (
                        <Badge key={index} variant="outline" className={cn("border mr-1 text-xs font-technical", getCategoryColor(cat.trim()))}>
                          {cat.trim()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-technical">{item.unit}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono px-2 py-1 bg-secondary/50 rounded text-sm">
                      {item.mass_per_unit ? item.mass_per_unit.toFixed(3) : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground font-technical" title={item.composition || 'No composition data'}>
                      {item.composition || 'No composition data'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn(
                      "font-mono border text-xs",
                      item.waste_mappings > 0 
                        ? "border-green-500/50 text-green-400 bg-green-500/10" 
                        : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                    )}>
                      {item.waste_mappings}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {renderSafetyFlags(item.safety)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onView(item)} title="View" className="hover:bg-primary/20 hover:text-primary">
                        <MdVisibility className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onEdit(item)} title="Edit" className="hover:bg-accent/20 hover:text-accent">
                        <MdEdit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDuplicate(item)} title="Duplicate" className="hover:bg-secondary">
                        <MdContentCopy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(item.id)}
                        title="Delete"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
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
    </div>
  )
}
