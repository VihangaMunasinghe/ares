"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MdVisibility, MdEdit, MdContentCopy, MdDelete, MdWarning } from "react-icons/md"
import type { ItemTemplate } from "@/types/items"
import { cn } from "@/lib/utils"

interface ItemsTableProps {
  items: ItemTemplate[]
  onView: (item: ItemTemplate) => void
  onEdit: (item: ItemTemplate) => void
  onDuplicate: (item: ItemTemplate) => void
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
    }
    return colors[category] || "bg-secondary text-foreground"
  }

  const hasValidationIssues = (item: ItemTemplate) => {
    const compositionSum = item.composition.reduce((sum, comp) => sum + comp.percent_by_mass, 0)
    return Math.abs(compositionSum - 100) > 0.01 || item.waste_mappings.length === 0
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
              className={cn("hover:bg-secondary/50 transition-colors", item.deprecated && "opacity-50 bg-secondary/30")}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {hasValidationIssues(item) && (
                    <MdWarning className="w-4 h-4 text-yellow-500" title="Validation issues" />
                  )}
                  <span>{item.name}</span>
                  {item.deprecated && (
                    <Badge variant="outline" className="text-xs">
                      Deprecated
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("border", getCategoryColor(item.category))}>
                  {item.category}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{item.unit}</TableCell>
              <TableCell className="text-right font-mono">{item.mass_per_unit_kg.toFixed(3)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.composition.slice(0, 2).map((comp) => (
                    <Badge key={comp.material_id} variant="secondary" className="text-xs">
                      {comp.material_name}: {comp.percent_by_mass}%
                    </Badge>
                  ))}
                  {item.composition.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{item.composition.length - 2} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="font-mono">
                  {item.waste_mappings.length}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {item.safety_flags?.flammability && item.safety_flags.flammability !== "low" && (
                    <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                      🔥
                    </Badge>
                  )}
                  {item.safety_flags?.toxicity && item.safety_flags.toxicity !== "none" && (
                    <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
                      ☠️
                    </Badge>
                  )}
                  {item.safety_flags?.bio && (
                    <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                      🦠
                    </Badge>
                  )}
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
