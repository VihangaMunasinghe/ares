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
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Category</TableHead>
            <TableHead className="font-semibold">Unit</TableHead>
            <TableHead className="font-semibold text-right">Mass/Unit (kg)</TableHead>
            <TableHead className="font-semibold">Composition</TableHead>
            <TableHead className="font-semibold text-center">Waste Mappings</TableHead>
            <TableHead className="font-semibold">Safety</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-secondary/50 transition-colors"
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {hasValidationIssues(item) && (
                    <MdWarning className="w-4 h-4 text-yellow-500" title="Validation issues" />
                  )}
                  <span>{item.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {item.category.split(', ').map((cat, index) => (
                  <Badge key={index} variant="outline" className={cn("border mr-1", getCategoryColor(cat.trim()))}>
                    {cat.trim()}
                  </Badge>
                ))}
              </TableCell>
              <TableCell className="text-muted-foreground">{item.unit}</TableCell>
              <TableCell className="text-right font-mono">
                {item.mass_per_unit ? item.mass_per_unit.toFixed(3) : 'N/A'}
              </TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground">
                  {item.composition || 'No composition data'}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="font-mono">
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
                  <Button size="sm" variant="ghost" onClick={() => onView(item)} title="View">
                    <MdVisibility className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(item)} title="Edit">
                    <MdEdit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDuplicate(item)} title="Duplicate">
                    <MdContentCopy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(item.id)}
                    title="Delete"
                    className="text-red-400 hover:text-red-300"
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
  )
}
