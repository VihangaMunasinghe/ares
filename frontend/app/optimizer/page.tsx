"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MdPlayArrow, MdTune, MdCheckCircle, MdError, MdSchedule, MdPending, MdCancel, MdSearch, MdFilterList } from "react-icons/md"
import { mockMissions } from "@/types/mission"
import { mockOptimizationJobs, mockOptimizationJobsForMission2 } from "@/lib/mock-data/optimization-jobs"
import type { Job } from "@/types/jobs"

export default function SchedulerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const missionId = searchParams.get("mission")
  
  const [selectedMission, setSelectedMission] = useState<any>(null)
  const [allOptimizationJobs, setAllOptimizationJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (missionId) {
      const mission = mockMissions.find(m => m.id === missionId)
      setSelectedMission(mission)
      
      // Load optimization jobs for this mission
      const allJobs = [...mockOptimizationJobs, ...mockOptimizationJobsForMission2]
      const missionJobs = allJobs.filter(job => job.missionId === missionId)
      setAllOptimizationJobs(missionJobs)
    }
  }, [missionId])

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    return allOptimizationJobs.filter(job => {
      const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.type.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      const matchesType = typeFilter === "all" || job.type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [allOptimizationJobs, searchQuery, statusFilter, typeFilter])

  // Paginate jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredJobs, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, typeFilter])

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
        <Button onClick={() => router.push(`/optimizer/new?mission=${missionId}`)} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <MdTune className="w-5 h-5" />
          Create New Job
        </Button>
      </div>


      {/* Optimization Jobs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Optimization Jobs</h2>
          <Badge variant="outline">{filteredJobs.length} of {allOptimizationJobs.length} jobs</Badge>
        </div>
        
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search jobs by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <MdFilterList className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="optimization">Optimization</SelectItem>
                    <SelectItem value="scheduling">Scheduling</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="simulation">Simulation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-4">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  {allOptimizationJobs.length === 0 
                    ? "No optimization jobs found for this mission"
                    : "No jobs match your current filters"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            paginatedJobs.map((job: Job) => (
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
                    
                    {job.status === "completed" && !job.result?.success && (
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/optimizer/results/${job.id}`)}
                          className="gap-1"
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                    
                    {job.result && job.result.success && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Optimization Results</h4>
                          <Button 
                            size="sm" 
                            onClick={() => router.push(`/optimizer/results/${job.id}`)}
                            className="gap-1"
                          >
                            View Results
                          </Button>
                        </div>
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  if (pageNumber > totalPages) return null
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
