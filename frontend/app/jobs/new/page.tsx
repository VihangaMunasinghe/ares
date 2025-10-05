"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MdArrowBack, MdNavigateNext } from "react-icons/md";
import { missionsApi } from "@/lib/api/missions";
import { jobsApi, type JobCreateRequest } from "@/lib/api/jobs";

export default function CreateJobPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const missionId = searchParams.get("mission") || "";

  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [availableMissions, setAvailableMissions] = useState<any[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState(missionId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Job details state
  const [jobName, setJobName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (missionId !== "") {
          // Load specific mission if ID provided
          const mission = await missionsApi.getMission(missionId);
          setSelectedMission(mission);
          setSelectedMissionId(missionId);
        } else {
          // Load all missions for selection
          const missions = await missionsApi.getMissions();
          setAvailableMissions(missions);
        }
      } catch (err) {
        console.error("Failed to load mission data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load mission data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [missionId]);

  // Load selected mission when mission ID changes
  useEffect(() => {
    if (
      selectedMissionId &&
      selectedMissionId !== missionId &&
      availableMissions.length > 0
    ) {
      const mission = availableMissions.find((m) => m.id === selectedMissionId);
      if (mission) {
        setSelectedMission(mission);
      }
    }
  }, [selectedMissionId, availableMissions, missionId]);

  const handleCreateJob = async () => {
    if (
      !selectedMission ||
      isSubmitting ||
      !jobName.trim() ||
      !selectedMissionId
    )
      return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create new job
      const jobData: JobCreateRequest = {
        mission_id: selectedMissionId!,
        total_weeks: selectedMission.duration_weeks,
        w_mass: 1.0,
        w_value: 1.0,
        w_crew: 0.5,
        w_energy: 0.2,
        w_risk: 0.3,
        w_make: 0.0,
        w_carry: 0.0,
        w_shortage: 10000.0,
        params: {
          name: jobName,
          description: jobDescription,
        },
      };

      const createdJob = await jobsApi.createJob(jobData);

      // Navigate to the [job_id] page with mission parameter
      router.push(`/jobs/${createdJob.id}?mission=${selectedMissionId}`);
    } catch (err) {
      console.error("Failed to create job:", err);
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(
      selectedMissionId ? `/jobs?mission=${selectedMissionId}` : "/jobs"
    );
  };

  const isValid =
    jobName.trim().length > 0 && selectedMissionId && selectedMission;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="text-red-600 font-medium">
                Failed to load data
              </div>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleCancel}>
          <MdArrowBack className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Job</h1>
          {selectedMission && (
            <p className="text-muted-foreground mt-1">
              For mission:{" "}
              <span className="font-semibold">{selectedMission.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Job Details Form */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Basic job information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {!missionId && (
              <div className="space-y-2">
                <Label htmlFor="missionSelect">Mission *</Label>
                <Select
                  value={selectedMissionId}
                  onValueChange={setSelectedMissionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMissions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.name} ({mission.duration_weeks} weeks)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="jobName">Job Name *</Label>
              <Input
                id="jobName"
                placeholder="Enter a descriptive name for this job"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="w-full"
              />
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
            </div>

            {selectedMission && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Mission Context</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">
                      {selectedMission.duration_weeks} weeks
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Crew Hours/Week:
                    </span>
                    <span className="ml-2 font-medium">
                      {selectedMission.crew_hours_per_week || 40}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="ml-2 font-medium">
                      {selectedMission.start_date
                        ? new Date(
                            selectedMission.start_date
                          ).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <span className="ml-2 font-medium">
                      {selectedMission.end_date
                        ? new Date(
                            selectedMission.end_date
                          ).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleCancel} className="gap-2">
          Cancel
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={handleCreateJob}
            disabled={!isValid || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? "Creating Job..." : "Create Job & Continue Setup"}
            <MdNavigateNext className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
