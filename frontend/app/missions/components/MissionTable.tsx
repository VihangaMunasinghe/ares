"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md"
import { mockMissions, type Mission } from "@/types/mission"

export function MissionTable() {
  const [missions, setMissions] = useState<Mission[]>(mockMissions)

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this mission? This action cannot be undone.")) {
      setMissions(missions.filter((m) => m.id !== id))
    }
  }

  const getStatusVariant = (status: Mission["status"]) => {
    switch (status) {
      case "Planned":
        return "outline"
      case "Running":
        return "default"
      case "Completed":
        return "secondary"
    }
  }

  if (missions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="text-6xl">🚀</div>
            <h3 className="text-xl font-semibold text-foreground">No missions yet</h3>
            <p className="text-muted-foreground max-w-sm">Get started by creating your first Mars mission</p>
            <Link href="/missions/new">
              <Button className="gap-2 mt-4">
                <MdEdit className="w-4 h-4" />
                Create your first mission
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mission Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Transit</TableHead>
              <TableHead>Surface</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Crew</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((mission) => (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">{mission.name}</TableCell>
                <TableCell>{mission.duration_weeks}w</TableCell>
                <TableCell>{mission.transit_weeks}w</TableCell>
                <TableCell>{mission.surface_weeks}w</TableCell>
                <TableCell>{mission.return_weeks}w</TableCell>
                <TableCell>{mission.crew_count}</TableCell>
                <TableCell>{mission.created_by}</TableCell>
                <TableCell>{new Date(mission.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(mission.status)}>{mission.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/missions/${mission.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <MdVisibility className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/missions/${mission.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <MdEdit className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(mission.id)}
                    >
                      <MdDelete className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
