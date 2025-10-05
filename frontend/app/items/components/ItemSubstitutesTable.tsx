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
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full"></div>
            <h3 className="text-lg font-technical tracking-wide uppercase">Substitution Matrix</h3>
          </div>
          <p className="text-sm text-muted-foreground font-technical">
            Resource optimization • Cross-compatibility mapping • Mission flexibility
          </p>
        </div>
        <Button 
          onClick={onAdd} 
          size="sm"
          className="font-technical tracking-wide bg-accent hover:bg-accent/90"
        >
          <MdAdd className="w-4 h-4 mr-2" />
          Add Relationship
        </Button>
      </div>

      {/* Enhanced Table */}
      {loading ? (
        <div className="rounded-lg border border-border/50 bg-background/50 p-12">
          <div className="text-center space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            </div>
            <p className="text-muted-foreground font-technical">Loading substitution matrix...</p>
          </div>
        </div>
      ) : relationships.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-background/50 p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary/50 flex items-center justify-center">
              <MdAdd className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-muted-foreground font-technical">No Relationships Configured</p>
              <p className="text-sm text-muted-foreground/70 font-technical mt-1">
                Configure item-substitute relationships to enable resource optimization
              </p>
            </div>
            <Button onClick={onAdd} className="mt-4 font-technical tracking-wide">
              Create First Relationship
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 border-b border-border/50">
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Primary Item</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Item Key</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Substitute Item</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Substitute Key</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-right">Value Ratio</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-right">Lifetime (w)</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase">Established</TableHead>
                <TableHead className="font-technical font-semibold tracking-wider text-xs uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relationships.map((relationship) => (
                <TableRow
                  key={relationship.relationship_id}
                  className="hover:bg-secondary/30 transition-all duration-200 border-b border-border/20"
                >
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div className="font-technical tracking-wide">{relationship.item_name}</div>
                      <Badge variant="outline" className="text-xs font-technical border-blue-500/50 text-blue-400 bg-blue-500/10">
                        Primary
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    <div className="px-2 py-1 bg-secondary/50 rounded text-xs">
                      {relationship.item_key}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div className="font-technical tracking-wide">{relationship.substitute_name}</div>
                      <Badge variant="outline" className="text-xs font-technical border-green-500/50 text-green-400 bg-green-500/10">
                        Substitute
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    <div className="px-2 py-1 bg-secondary/50 rounded text-xs">
                      {relationship.substitute_key}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end space-y-1">
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded font-mono text-sm">
                        {relationship.substitute_value_per_unit.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground font-technical">per unit</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="px-2 py-1 bg-secondary/50 rounded font-mono text-sm">
                      {relationship.substitute_lifetime_weeks}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="space-y-1">
                      <div className="text-sm font-technical">
                        {new Date(relationship.relationship_created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground/70 font-technical">
                        Sol {Math.floor(Math.random() * 1000) + 1200}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(relationship.relationship_id)}
                        title="Delete relationship"
                        className="hover:bg-red-500/20 hover:text-red-400"
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