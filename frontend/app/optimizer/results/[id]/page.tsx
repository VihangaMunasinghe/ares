"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MdArrowBack, MdCheckCircle, MdError, MdTrendingUp, MdAccessTime, MdAssignment, MdCompare, MdCalendarToday } from "react-icons/md"
import { mockOptimizationJobs, mockOptimizationJobsForMission2 } from "@/lib/mock-data/optimization-jobs"
import DiffViewer from "@/components/DiffViewer"
import OptimizationCharts from "@/components/OptimizationCharts"
import type { Job } from "@/types/jobs"

export default function OptimizationResultsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    if (jobId) {
      const allJobs = [...mockOptimizationJobs, ...mockOptimizationJobsForMission2]
      const foundJob = allJobs.find(j => j.id === jobId)
      setJob(foundJob || null)
    }
  }, [jobId])

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Optimization Results</h1>
            <p className="text-muted-foreground mt-1">Job not found</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">The requested optimization job could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = job.status === "completed"
  const isSuccessful = job.result?.success
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <MdArrowBack className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              isSuccessful ? (
                <MdCheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <MdError className="w-6 h-6 text-red-500" />
              )
            ) : (
              <MdAccessTime className="w-6 h-6 text-blue-500" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{job.name}</h1>
              <p className="text-muted-foreground mt-1">
                {job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job Results
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted && isSuccessful && (
            <Button 
              onClick={() => router.push(`/scheduler?job=${job.id}`)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <MdCalendarToday className="w-4 h-4" />
              View Schedule
            </Button>
          )}
          <Badge variant={isCompleted ? (isSuccessful ? "default" : "destructive") : "secondary"}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Job Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Job Overview</CardTitle>
          <CardDescription>Basic information about this optimization job</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MdAssignment className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Job Type</span>
              </div>
              <p className="text-lg capitalize">{job.type}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MdAccessTime className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <p className="text-lg">{new Date(job.createdAt).toLocaleString()}</p>
            </div>
            
            {job.startedAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MdAccessTime className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Started</span>
                </div>
                <p className="text-lg">{new Date(job.startedAt).toLocaleString()}</p>
              </div>
            )}
            
            {job.completedAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MdCheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <p className="text-lg">{new Date(job.completedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {job.error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
              <MdError className="w-5 h-5" />
              Error Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">{job.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {job.result && isCompleted && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          {job.result.metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdTrendingUp className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Key performance indicators for this optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {job.result.metrics.optimizationScore && (
                    <div className="text-center p-6 border border-green-200 bg-green-100 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
                      <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {job.result.metrics.optimizationScore}/10
                      </div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-200 mt-1">
                        Optimization Score
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center p-6 border border-blue-200 bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg">
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {job.result.metrics.duration}m
                    </div>
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mt-1">
                      Duration
                    </div>
                  </div>
                  
                  <div className="text-center p-6 border border-purple-200 bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 rounded-lg">
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {job.result.metrics.itemsProcessed}
                    </div>
                    <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mt-1">
                      Items Processed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimization Diff Viewer */}
          {job.result.data.optimizationDiff && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdCompare className="w-5 h-5" />
                  Optimization Changes
                </CardTitle>
                <CardDescription>
                  Material quantity changes and optimization justifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DiffViewer diff={job.result.data.optimizationDiff} />
              </CardContent>
            </Card>
          )}

          {/* Optimization Charts */}
          {job.result.data.optimizationDiff && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdTrendingUp className="w-5 h-5" />
                  Optimization Analytics
                </CardTitle>
                <CardDescription>
                  Visual analysis of optimization results and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OptimizationCharts 
                  diff={job.result.data.optimizationDiff} 
                  optimizedSchedule={job.result.data.optimizedSchedule}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Job Still Running */}
      {!isCompleted && job.status === "running" && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Job is still running... Progress: {job.progress}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}