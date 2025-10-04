"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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
  
  // Constraints state
  const [constraints, setConstraints] = useState({
    maxCrewHours: [40],
    maxEnergyUsage: [80],
    minWasteReduction: [70],
    maxProcessingTime: [120],
    prioritizeMassReduction: true,
    prioritizeValueGeneration: false,
    allowOvertime: false,
    minimizeRisk: true
  })

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
    
    // Navigate back to optimizer with success
    router.push(`/optimizer?mission=${missionId}&created=true`)
  }

  const handleCancel = () => {
    router.push(`/optimizer?mission=${missionId}`)
  }

  if (!missionId || !selectedMission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/optimizer")}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back to Optimizer
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
          Back to Optimizer
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

      <Card className="w-full">
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
        </CardContent>
      </Card>

      {/* Optimization Constraints */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Optimization Constraints</CardTitle>
          <CardDescription>
            Configure the constraints and priorities for the optimization algorithm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resource Constraints */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Resource Limits</h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="flex items-center justify-between">
                    <span>Max Crew Hours per Week</span>
                    <span className="text-sm font-medium">{constraints.maxCrewHours[0]}h</span>
                  </Label>
                  <Slider
                    value={constraints.maxCrewHours}
                    onValueChange={(value) => setConstraints(prev => ({ ...prev, maxCrewHours: value }))}
                    max={60}
                    min={20}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between">
                    <span>Max Energy Usage (%)</span>
                    <span className="text-sm font-medium">{constraints.maxEnergyUsage[0]}%</span>
                  </Label>
                  <Slider
                    value={constraints.maxEnergyUsage}
                    onValueChange={(value) => setConstraints(prev => ({ ...prev, maxEnergyUsage: value }))}
                    max={100}
                    min={30}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between">
                    <span>Min Waste Reduction (%)</span>
                    <span className="text-sm font-medium">{constraints.minWasteReduction[0]}%</span>
                  </Label>
                  <Slider
                    value={constraints.minWasteReduction}
                    onValueChange={(value) => setConstraints(prev => ({ ...prev, minWasteReduction: value }))}
                    max={95}
                    min={50}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between">
                    <span>Max Processing Time (min)</span>
                    <span className="text-sm font-medium">{constraints.maxProcessingTime[0]}min</span>
                  </Label>
                  <Slider
                    value={constraints.maxProcessingTime}
                    onValueChange={(value) => setConstraints(prev => ({ ...prev, maxProcessingTime: value }))}
                    max={300}
                    min={30}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Optimization Priorities */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Optimization Priorities</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Prioritize Mass Reduction</Label>
                    <p className="text-sm text-muted-foreground">Focus on minimizing waste mass</p>
                  </div>
                  <Switch
                    checked={constraints.prioritizeMassReduction}
                    onCheckedChange={(checked) => setConstraints(prev => ({ ...prev, prioritizeMassReduction: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Prioritize Value Generation</Label>
                    <p className="text-sm text-muted-foreground">Focus on maximizing output value</p>
                  </div>
                  <Switch
                    checked={constraints.prioritizeValueGeneration}
                    onCheckedChange={(checked) => setConstraints(prev => ({ ...prev, prioritizeValueGeneration: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Overtime</Label>
                    <p className="text-sm text-muted-foreground">Permit crew to work beyond normal hours</p>
                  </div>
                  <Switch
                    checked={constraints.allowOvertime}
                    onCheckedChange={(checked) => setConstraints(prev => ({ ...prev, allowOvertime: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Minimize Risk</Label>
                    <p className="text-sm text-muted-foreground">Choose safer processing methods</p>
                  </div>
                  <Switch
                    checked={constraints.minimizeRisk}
                    onCheckedChange={(checked) => setConstraints(prev => ({ ...prev, minimizeRisk: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Optimization Button */}
      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleCreateJob} 
          disabled={!jobName.trim() || isCreating}
          size="lg"
          className="px-12 py-4 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 gap-3"
        >
          <MdPlayArrow className="w-6 h-6" />
          {isCreating ? "Running Optimization..." : "Run Optimization"}
        </Button>
      </div>
    </div>
  )
}
