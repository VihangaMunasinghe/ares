"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MdVisibility, MdEdit, MdDelete, MdRefresh, MdAdd } from "react-icons/md"
import { missionsApi, type Mission } from "@/lib/api/missions"
import { toast } from "@/hooks/use-toast"
import { MissionEditDialog } from "./MissionEditDialog"
import { MissionCreateDialog } from "./MissionCreateDialog"

export function MissionTable() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

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

  const handleEdit = (mission: Mission) => {
    setEditingMission(mission)
    setEditDialogOpen(true)
  }

  const handleMissionUpdated = (updatedMission: Mission) => {
    setMissions(missions.map(m => m.id === updatedMission.id ? updatedMission : m))
  }

  const handleMissionCreated = (newMission: Mission) => {
    setMissions([newMission, ...missions])
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
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-semibold text-foreground font-technical tracking-wide">LOADING MISSIONS</h3>
            <p className="text-muted-foreground font-technical tracking-wider text-sm uppercase">Establishing connection • Please wait</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/10">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground font-technical tracking-wide">MISSION DATA ERROR</h3>
            <p className="text-muted-foreground max-w-sm font-technical tracking-wider text-sm">{error}</p>
            <Button onClick={fetchMissions} className="gap-2 mt-4 font-technical">
              <MdRefresh className="w-4 h-4" />
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (missions.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground font-technical tracking-wide">NO MISSIONS CONFIGURED</h3>
            <p className="text-muted-foreground max-w-sm font-technical tracking-wider text-sm">Initialize your Mars operations by creating your first mission</p>
            <Link href="/missions/new">
              <Button className="gap-2 mt-4 font-technical tracking-wide uppercase">
                <MdAdd className="w-4 h-4" />
                Create First Mission
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="flex justify-between items-center p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold font-technical tracking-wide text-foreground">MISSIONS ({missions.length})</h2>
          <div className="flex gap-2">
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 font-technical tracking-wide uppercase">
              <MdAdd className="w-4 h-4" />
              New Mission
            </Button>
            <Button onClick={fetchMissions} variant="outline" size="sm" className="gap-2 font-technical">
              <MdRefresh className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Mission Name</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Description</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Duration</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Transit</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Surface</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Return</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Crew</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Hours/Week</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Printer Cap.</TableHead>
              <TableHead className="font-technical tracking-wider uppercase text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="text-right font-technical tracking-wider uppercase text-xs text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((mission) => (
              <TableRow key={mission.id} className="border-border/30 hover:bg-secondary/30">
                <TableCell className="font-medium font-technical text-foreground">{mission.name}</TableCell>
                <TableCell className="max-w-xs truncate font-technical text-muted-foreground" title={mission.description || ''}>
                  {mission.description || 'No description'}
                </TableCell>
                <TableCell className="font-technical text-accent">{mission.duration_weeks}w</TableCell>
                <TableCell className="font-technical text-muted-foreground">{mission.transit_weeks}w</TableCell>
                <TableCell className="font-technical text-primary">{mission.surface_weeks}w</TableCell>
                <TableCell className="font-technical text-muted-foreground">{mission.return_weeks}w</TableCell>
                <TableCell className="font-technical text-foreground">{mission.crew_count}</TableCell>
                <TableCell className="font-technical text-muted-foreground">{mission.crew_hours_per_week}h</TableCell>
                <TableCell className="font-technical text-accent">{mission.printer_capacity_kg_per_week}kg/w</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(mission.status)} className="font-technical uppercase tracking-wider">{mission.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/missions/${mission.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1 font-technical">
                        <MdVisibility className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 font-technical"
                      onClick={() => handleEdit(mission)}
                    >
                      <MdEdit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive font-technical"
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

      <MissionEditDialog
        mission={editingMission}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onMissionUpdated={handleMissionUpdated}
      />

      <MissionCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onMissionCreated={handleMissionCreated}
      />
    </Card>
  )
}
