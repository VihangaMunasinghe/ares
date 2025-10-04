"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MdPlayArrow, MdTune, MdCheckCircle, MdError, MdSchedule, MdPending, MdCancel } from "react-icons/md"
import { mockMissions } from "@/types/mission"
import { mockOptimizationJobs, mockOptimizationJobsForMission2 } from "@/lib/mock-data/optimization-jobs"
import type { Job } from "@/types/jobs"

export default function SchedulerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const missionId = searchParams.get("mission")
  
  const [selectedMission, setSelectedMission] = useState<any>(null)
  const [optimizationJobs, setOptimizationJobs] = useState<Job[]>([])

  useEffect(() => {
    if (missionId) {
      const mission = mockMissions.find(m => m.id === missionId)
      setSelectedMission(mission)
      
      // Load optimization jobs for this mission
      const allJobs = [...mockOptimizationJobs, ...mockOptimizationJobsForMission2]
      const missionJobs = allJobs.filter(job => job.missionId === missionId)
      setOptimizationJobs(missionJobs)
    }
  }, [missionId])

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "completed":
        return <MdCheckCircle className="w-4 h-4 text-green-500" />
      case "running":
        return <MdSchedule className="w-4 h-4 text-blue-500" />
      case "failed":
        return <MdError className="w-4 h-4 text-red-500" />
      case "pending":
        return <MdPending className="w-4 h-4 text-yellow-500" />
      case "cancelled":
        return <MdCancel className="w-4 h-4 text-gray-500" />
      default:
        return <MdPending className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: Job["status"]) => {
    switch (status) {
      case "completed":
        return "default"
      case "running":
        return "secondary"
      case "failed":
        return "destructive"
      case "pending":
        return "outline"
      case "cancelled":
        return "secondary"
      default:
        return "outline"
    }
  }


  if (!missionId || !selectedMission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mission Optimizer</h1>
            <p className="text-muted-foreground mt-1">Optimize and schedule mission operations</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Please select a mission to view optimization options</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mission Optimizer</h1>
          <p className="text-muted-foreground mt-1">
            Optimizing: <span className="font-semibold">{selectedMission.name}</span>
          </p>
        </div>
        <Button onClick={() => router.push(`/scheduler/new?mission=${missionId}`)} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <MdTune className="w-5 h-5" />
          Create New Job
        </Button>
      </div>


      {/* Optimization Jobs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Optimization Jobs</h2>
          <Badge variant="outline">{optimizationJobs.length} jobs</Badge>
        </div>
        
        <div className="grid gap-4">
          {optimizationJobs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No optimization jobs found for this mission</p>
              </CardContent>
            </Card>
          ) : (
            optimizationJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <CardTitle className="text-lg">{job.name}</CardTitle>
                        <CardDescription>
                          {job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job • 
                          Created {new Date(job.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(job.status)}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.status === "running" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="w-full" />
                      </div>
                    )}
                    
                    {job.startedAt && (
                      <div className="text-sm text-muted-foreground">
                        Started: {new Date(job.startedAt).toLocaleString()}
                      </div>
                    )}
                    
                    {job.completedAt && (
                      <div className="text-sm text-muted-foreground">
                        Completed: {new Date(job.completedAt).toLocaleString()}
                      </div>
                    )}
                    
                    {job.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        Error: {job.error}
                      </div>
                    )}
                    
                    {job.result && job.result.success && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Optimization Results</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="border border-green-200 bg-green-100 dark:bg-green-900/20 dark:border-green-800 p-3 rounded-lg">
                            <div className="font-medium text-green-800 dark:text-green-200">Score</div>
                            <div className="text-lg font-bold text-green-900 dark:text-green-100">{job.result.metrics.optimizationScore}/10</div>
                          </div>
                          <div className="border border-blue-200 bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 p-3 rounded-lg">
                            <div className="font-medium text-blue-800 dark:text-blue-200">Duration</div>
                            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{job.result.metrics.duration}m</div>
                          </div>
                          <div className="border border-purple-200 bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 p-3 rounded-lg">
                            <div className="font-medium text-purple-800 dark:text-purple-200">Items Processed</div>
                            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">{job.result.metrics.itemsProcessed}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
