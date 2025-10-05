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
    <div className="space-y-4">
      {substitutes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-technical">No substitutes found matching your search criteria</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 border-b border-border/50">
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Name</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Key</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-right">Value/Unit</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-right">Lifetime (weeks)</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Created</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {substitutes.map((substitute) => (
                <TableRow
                  key={substitute.id}
                  className="hover:bg-secondary/30 transition-all duration-200 border-b border-border/20"
                >
                  <TableCell className="font-medium">
                    <div>
                      <span className="font-technical">{substitute.name}</span>
                      <div className="text-xs text-muted-foreground font-technical mt-1">
                        ID: {substitute.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
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
                  <TableCell className="text-muted-foreground text-sm font-technical">
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
      )}
    </div>
  )
}