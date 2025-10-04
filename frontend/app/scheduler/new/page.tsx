"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MdArrowBack, MdPlayArrow, MdTune } from "react-icons/md"
import { mockMissions } from "@/types/mission"
import type { Job } from "@/types/jobs"

export default function CreateJobPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const missionId = searchParams.get("mission")
  
  const [selectedMission, setSelectedMission] = useState<any>(null)
  const [jobName, setJobName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [jobType, setJobType] = useState<"optimization" | "scheduling" | "analysis" | "simulation">("optimization")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (missionId) {
      const mission = mockMissions.find(m => m.id === missionId)
      setSelectedMission(mission)
    }
  }, [missionId])

  const handleCreateJob = async () => {
    if (!jobName.trim()) return

    setIsCreating(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In a real app, this would call the API to create the job
    console.log("Creating job:", {
      name: jobName,
      type: jobType,
      description: jobDescription,
      missionId: missionId
    })
    
    // Navigate back to scheduler with success
    router.push(`/scheduler?mission=${missionId}&created=true`)
  }

  const handleCancel = () => {
    router.push(`/scheduler?mission=${missionId}`)
  }

  if (!missionId || !selectedMission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/scheduler")}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back to Scheduler
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Mission not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleCancel}>
          <MdArrowBack className="w-4 h-4 mr-2" />
          Back to Scheduler
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Optimization Job</h1>
          <p className="text-muted-foreground mt-1">
            For mission: <span className="font-semibold">{selectedMission.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MdTune className="w-5 h-5" />
          <span className="text-sm">Job Creation</span>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Job Configuration</CardTitle>
          <CardDescription>
            Configure the parameters for your new optimization job
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jobName">Job Name *</Label>
            <Input
              id="jobName"
              placeholder="Enter a descriptive name for this job"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Choose a clear, descriptive name for your optimization job
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type *</Label>
            <Select value={jobType} onValueChange={(value: any) => setJobType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="optimization">
                  <div>
                    <div className="font-medium">Optimization</div>
                    <div className="text-sm text-muted-foreground">Optimize resource allocation and scheduling</div>
                  </div>
                </SelectItem>
                <SelectItem value="scheduling">
                  <div>
                    <div className="font-medium">Scheduling</div>
                    <div className="text-sm text-muted-foreground">Create detailed mission schedules</div>
                  </div>
                </SelectItem>
                <SelectItem value="analysis">
                  <div>
                    <div className="font-medium">Analysis</div>
                    <div className="text-sm text-muted-foreground">Analyze mission parameters and constraints</div>
                  </div>
                </SelectItem>
                <SelectItem value="simulation">
                  <div>
                    <div className="font-medium">Simulation</div>
                    <div className="text-sm text-muted-foreground">Run mission simulations and scenarios</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Description</Label>
            <Textarea
              id="jobDescription"
              placeholder="Describe the goals and requirements for this optimization job..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Provide additional context about what you want to optimize or achieve
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Mission Context</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Mission:</span>
                <div className="font-medium">{selectedMission.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <div className="font-medium">{selectedMission.duration_weeks} weeks</div>
              </div>
              <div>
                <span className="text-muted-foreground">Crew Size:</span>
                <div className="font-medium">{selectedMission.crew_count} members</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-medium">{selectedMission.status}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCreateJob} 
              disabled={!jobName.trim() || isCreating}
              className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <MdPlayArrow className="w-4 h-4" />
              {isCreating ? "Creating Job..." : "Create Job"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
