"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MdVisibility, MdEdit, MdContentCopy, MdDelete } from "react-icons/md"
import type { SubstituteGlobal } from "@/lib/api/global-entities"

interface SubstitutesTableProps {
  substitutes: SubstituteGlobal[]
  onView: (substitute: SubstituteGlobal) => void
  onEdit: (substitute: SubstituteGlobal) => void
  onDuplicate: (substitute: SubstituteGlobal) => void
  onDelete: (substituteId: string) => void
}

export function SubstitutesTable({ substitutes, onView, onEdit, onDuplicate, onDelete }: SubstitutesTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Key</TableHead>
            <TableHead className="font-semibold text-right">Value/Unit</TableHead>
            <TableHead className="font-semibold text-right">Lifetime (weeks)</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {substitutes.map((substitute) => (
            <TableRow
              key={substitute.id}
              className="hover:bg-secondary/50 transition-colors"
            >
              <TableCell className="font-medium">
                {substitute.name}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-sm">
                {substitute.key}
              </TableCell>
              <TableCell className="text-right font-mono">
                {substitute.value_per_unit.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {substitute.lifetime_weeks}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(substitute.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onView(substitute)} title="View">
                    <MdVisibility className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(substitute)} title="Edit">
                    <MdEdit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDuplicate(substitute)} title="Duplicate">
                    <MdContentCopy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(substitute.id)}
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