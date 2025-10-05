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
    router.push(`/jobs?mission=${mission.id}`)
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
        {/* <div className="space-y-1">
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

        </div> */}

        {/* Mission header with NASA-style typography */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute top-0 left-0 w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            <div className="flex items-center gap-3 pt-4">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{mission.name.toUpperCase()}</h1>
              <Badge variant={getStatusVariant(mission.status)} className="font-technical uppercase tracking-wider">{mission.status}</Badge>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-muted-foreground font-technical tracking-wide">{mission.description || 'Mission description not provided'}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground font-technical tracking-wider">ID: {mission.id.slice(0, 8).toUpperCase()}</span>
              {mission.owner_id && (
                <span className="text-muted-foreground font-technical tracking-wider">OWNER: {mission.owner_id.slice(0, 8).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Optimize Mission button with NASA styling */}
        <div className="flex-shrink-0 flex gap-2">
          <Button 
            onClick={handleOptimize}
            size="lg"
            className="mission-card-glow bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white font-technical font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-3 px-6 py-3 tracking-wide uppercase"
          >
            <MdTune className="w-5 h-5" />
            Optimize Mission
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent font-technical" onClick={handleDelete} disabled={isDeleting}>
            <MdDelete className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm mission-card-glow relative overflow-hidden group hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium font-technical tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
              <MdCalendarToday className="w-4 h-4 text-primary" />
              Mission Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-technical">Total Duration:</span>
              <span className="text-lg font-bold font-technical text-foreground">{mission.duration_weeks}w</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Transit:</span>
                <span className="text-sm font-medium font-technical text-accent">{mission.transit_weeks}w</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Surface Ops:</span>
                <span className="text-sm font-medium font-technical text-primary">{mission.surface_weeks}w</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Return:</span>
                <span className="text-sm font-medium font-technical text-accent">{mission.return_weeks}w</span>
              </div>
            </div>
            {mission.mission_start_date && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Launch Date:</span>
                  <span className="text-sm font-medium font-technical text-foreground">{new Date(mission.mission_start_date).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm mission-card-glow relative overflow-hidden group hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium font-technical tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
              <MdPeople className="w-4 h-4 text-primary" />
              Crew Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-technical">Crew Size:</span>
              <span className="text-lg font-bold font-technical text-foreground">{mission.crew_count}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Hours/Week:</span>
                <span className="text-sm font-medium font-technical text-accent">{mission.crew_hours_per_week}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Total Hours:</span>
                <span className="text-sm font-medium font-technical text-primary">
                  {mission.crew_count * mission.crew_hours_per_week * mission.duration_weeks}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm mission-card-glow relative overflow-hidden group hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium font-technical tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
              <MdBuild className="w-4 h-4 text-primary" />
              Resource Systems
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-technical">3D Printer:</span>
              <span className="text-lg font-bold font-technical text-foreground">{mission.printer_capacity_kg_per_week} kg/w</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Tools:</span>
                <span className="text-sm font-medium font-technical text-accent">{mission.tools_available.length} Available</span>
              </div>
              <div className="text-xs text-muted-foreground font-technical mt-2 p-2 bg-secondary/30 rounded border border-border/30">
                {mission.tools_available.length > 0 ? mission.tools_available.join(", ") : "No tools configured"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm mission-card-glow relative overflow-hidden group hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium font-technical tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
              <MdRocket className="w-4 h-4 text-primary" />
              Production Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-technical">Weekly Output:</span>
              <span className="text-lg font-bold font-technical text-foreground">{mission.printer_capacity_kg_per_week} kg</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Surface Total:</span>
                <span className="text-sm font-medium font-technical text-accent">
                  {mission.printer_capacity_kg_per_week * mission.surface_weeks} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Mission Total:</span>
                <span className="text-sm font-medium font-technical text-primary">
                  {mission.printer_capacity_kg_per_week * mission.duration_weeks} kg
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
