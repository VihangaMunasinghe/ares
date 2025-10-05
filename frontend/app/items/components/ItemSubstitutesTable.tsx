"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MdDelete, MdAdd } from "react-icons/md"
import type { ItemSubstituteRelationship } from "@/lib/api/global-entities"

interface ItemSubstitutesTableProps {
  relationships: ItemSubstituteRelationship[]
  onDelete: (relationshipId: string) => void
  onAdd: () => void
  loading?: boolean
}

export function ItemSubstitutesTable({ relationships, onDelete, onAdd, loading }: ItemSubstitutesTableProps) {
  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Item-Substitute Relationships</h3>
          <p className="text-sm text-muted-foreground">
            Manage which substitutes can replace which items
          </p>
        </div>
        <Button onClick={onAdd} size="sm">
          <MdAdd className="w-4 h-4 mr-2" />
          Add Relationship
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold">Item Key</TableHead>
              <TableHead className="font-semibold">Substitute</TableHead>
              <TableHead className="font-semibold">Substitute Key</TableHead>
              <TableHead className="font-semibold text-right">Value/Unit</TableHead>
              <TableHead className="font-semibold text-right">Lifetime (weeks)</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading relationships...
                </TableCell>
              </TableRow>
            ) : relationships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No item-substitute relationships found. Click "Add Relationship" to create one.
                </TableCell>
              </TableRow>
            ) : (
              relationships.map((relationship) => (
                <TableRow
                  key={relationship.relationship_id}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    {relationship.item_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {relationship.item_key}
                  </TableCell>
                  <TableCell className="font-medium">
                    {relationship.substitute_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {relationship.substitute_key}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {relationship.substitute_value_per_unit.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {relationship.substitute_lifetime_weeks}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(relationship.relationship_created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(relationship.relationship_id)}
                        title="Delete relationship"
                        className="text-red-400 hover:text-red-300"
                      >
                        <MdDelete className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats */}
      {!loading && relationships.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {relationships.length} relationship{relationships.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}