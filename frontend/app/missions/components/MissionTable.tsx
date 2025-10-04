"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MdVisibility, MdEdit, MdDelete, MdRefresh } from "react-icons/md"
import { missionsApi, type Mission } from "@/lib/api/missions"
import { toast } from "@/hooks/use-toast"

export function MissionTable() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await missionsApi.getMissions()
      setMissions(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch missions'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissions()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await missionsApi.deleteMission(id)
        setMissions(missions.filter((m) => m.id !== id))
        toast({
          title: "Success",
          description: "Mission deleted successfully",
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete mission'
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
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
      case "Archived":
        return "secondary"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="animate-spin text-4xl">🔄</div>
            <h3 className="text-xl font-semibold text-foreground">Loading missions...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your missions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h3 className="text-xl font-semibold text-foreground">Error loading missions</h3>
            <p className="text-muted-foreground max-w-sm">{error}</p>
            <Button onClick={fetchMissions} className="gap-2 mt-4">
              <MdRefresh className="w-4 h-4" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Missions ({missions.length})</h2>
          <Button onClick={fetchMissions} variant="outline" size="sm" className="gap-2">
            <MdRefresh className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mission Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Transit</TableHead>
              <TableHead>Surface</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Crew</TableHead>
              <TableHead>Crew Hours/Week</TableHead>
              <TableHead>Printer Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((mission) => (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">{mission.name}</TableCell>
                <TableCell className="max-w-xs truncate" title={mission.description || ''}>
                  {mission.description || 'No description'}
                </TableCell>
                <TableCell>{mission.duration_weeks}w</TableCell>
                <TableCell>{mission.transit_weeks}w</TableCell>
                <TableCell>{mission.surface_weeks}w</TableCell>
                <TableCell>{mission.return_weeks}w</TableCell>
                <TableCell>{mission.crew_count}</TableCell>
                <TableCell>{mission.crew_hours_per_week}h</TableCell>
                <TableCell>{mission.printer_capacity_kg_per_week}kg/w</TableCell>
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
                    <Link href={`/missions/${mission.id}?edit=true`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <MdEdit className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(mission.id, mission.name)}
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
