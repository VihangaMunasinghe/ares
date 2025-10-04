"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MdEdit, MdDelete, MdRocket, MdPeople, MdBuild, MdCalendarToday, MdTune } from "react-icons/md"
import { missionsApi, type Mission } from "@/lib/api/missions"
import { toast } from "@/hooks/use-toast"

interface MissionSummaryProps {
  mission: Mission
}

export function MissionSummary({ mission }: MissionSummaryProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this mission? This action cannot be undone.")) {
      setIsDeleting(true)
      try {
        await missionsApi.deleteMission(mission.id)
        toast({
          title: "Success",
          description: "Mission deleted successfully",
        })
        router.push("/missions")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete mission'
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        setIsDeleting(false)
      }
    }
  }

  const handleOptimize = () => {
    router.push(`/optimizer?mission=${mission.id}`)
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{mission.name}</h1>
            <Badge variant={getStatusVariant(mission.status)}>{mission.status}</Badge>
          </div>
          <p className="text-muted-foreground">{mission.description || 'No description provided'}</p>
          <p className="text-sm text-muted-foreground">Mission ID: {mission.id}</p>
          {mission.owner_id && (
            <p className="text-sm text-muted-foreground">Owner ID: {mission.owner_id}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleOptimize}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-3 px-6 py-3"
          >
            <MdTune className="w-5 h-5" />
            Optimize Mission
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <MdEdit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={handleDelete} disabled={isDeleting}>
            <MdDelete className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MdCalendarToday className="w-4 h-4 text-muted-foreground" />
              Duration & Phases
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Duration:</span>
              <span className="text-sm font-medium">{mission.duration_weeks} weeks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Transit:</span>
              <span className="text-sm font-medium">{mission.transit_weeks}w</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Surface:</span>
              <span className="text-sm font-medium">{mission.surface_weeks}w</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Return:</span>
              <span className="text-sm font-medium">{mission.return_weeks}w</span>
            </div>
            {mission.mission_start_date && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Start Date:</span>
                <span className="text-sm font-medium">{new Date(mission.mission_start_date).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MdPeople className="w-4 h-4 text-muted-foreground" />
              Crew
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Crew Count:</span>
              <span className="text-sm font-medium">{mission.crew_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Hours/Week:</span>
              <span className="text-sm font-medium">{mission.crew_hours_per_week}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Hours:</span>
              <span className="text-sm font-medium">
                {mission.crew_count * mission.crew_hours_per_week * mission.duration_weeks}h
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MdBuild className="w-4 h-4 text-muted-foreground" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Printer Capacity:</span>
              <span className="text-sm font-medium">{mission.printer_capacity_kg_per_week} kg/w</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tools Available:</span>
              <span className="text-sm font-medium">{mission.tools_available.length}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {mission.tools_available.length > 0 ? mission.tools_available.join(", ") : "No tools specified"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MdRocket className="w-4 h-4 text-muted-foreground" />
              Production Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Weekly:</span>
              <span className="text-sm font-medium">{mission.printer_capacity_kg_per_week} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Surface Total:</span>
              <span className="text-sm font-medium">
                {mission.printer_capacity_kg_per_week * mission.surface_weeks} kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Mission Total:</span>
              <span className="text-sm font-medium">
                {mission.printer_capacity_kg_per_week * mission.duration_weeks} kg
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
