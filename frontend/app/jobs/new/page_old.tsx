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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MdArrowBack,
  MdPlayArrow,
  MdNavigateNext,
  MdNavigateBefore,
  MdCheck,
  MdSettings,
} from "react-icons/md";
import { missionsApi } from "@/lib/api/missions";
import { jobsApi, type JobCreateRequest } from "@/lib/api/jobs";
import {
  globalEntitiesApi,
  type MaterialGlobal,
  type MethodGlobal,
  type OutputGlobal,
  type ItemGlobal,
  type SubstituteGlobal,
} from "@/lib/api/global-entities";

// Job creation steps
const STEPS = [
  { id: 1, title: "Job Details", description: "Basic job information" },
  {
    id: 2,
    title: "Select Entities",
    description: "Choose materials, methods, outputs, items, and substitutes",
  },
  {
    id: 3,
    title: "Set Inventories",
    description: "Configure initial inventory levels",
  },
  {
    id: 4,
    title: "Demands & Deadlines",
    description: "Set item demands and deadlines",
  },
  {
    id: 5,
    title: "Resources & Capacity",
    description: "Configure weekly resources and method capacity",
  },
  {
    id: 6,
    title: "Review & Run",
    description: "Review configuration and run optimization",
  },
];

interface JobWizardState {
  // Step 1: Job Details
  jobName: string;
  jobDescription: string;
  selectedMissionId: string;

  // Step 2: Entity Selection
  selectedMaterials: string[];
  selectedMethods: string[];
  selectedOutputs: string[];
  selectedItems: string[];
  selectedSubstitutes: string[];

  // Step 3: Inventories
  materialInventories: Record<string, number>;
  outputInventories: Record<string, number>;
  itemInventories: Record<string, number>;
  substituteInventories: Record<string, number>;

  // Step 4: Demands & Deadlines
  itemDemands: Array<{ itemId: string; week: number; amount: number }>;
  itemDeadlines: Array<{ itemId: string; week: number; amount: number }>;

  // Step 5: Resources & Capacity
  weeklyResources: Array<{
    week: number;
    crewAvailable: number;
    energyAvailable: number;
  }>;
  methodCapacities: Array<{
    methodId: string;
    week: number;
    maxCapacityKg: number;
    available: boolean;
  }>;
}

export default function CreateJobWizardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const missionId = searchParams.get("mission");
  // No jobId for new job creation

  const [currentStep, setCurrentStep] = useState(1);
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Global entities
  const [materials, setMaterials] = useState<MaterialGlobal[]>([]);
  const [methods, setMethods] = useState<MethodGlobal[]>([]);
  const [outputs, setOutputs] = useState<OutputGlobal[]>([]);
  const [items, setItems] = useState<ItemGlobal[]>([]);
  const [substitutes, setSubstitutes] = useState<SubstituteGlobal[]>([]);

  // Wizard state
  const [wizardState, setWizardState] = useState<JobWizardState>({
    jobName: "",
    jobDescription: "",
    selectedMissionId: missionId || "",
    selectedMaterials: [],
    selectedMethods: [],
    selectedOutputs: [],
    selectedItems: [],
    selectedSubstitutes: [],
    materialInventories: {},
    outputInventories: {},
    itemInventories: {},
    substituteInventories: {},
    itemDemands: [],
    itemDeadlines: [],
    weeklyResources: [],
    methodCapacities: [],
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load all missions and global entities in parallel
        const [
          missionsData,
          materialsData,
          methodsData,
          outputsData,
          itemsData,
          substitutesData,
        ] = await Promise.all([
          missionsApi.getMissions(),
          globalEntitiesApi.getMaterials(),
          globalEntitiesApi.getMethods(),
          globalEntitiesApi.getOutputs(),
          globalEntitiesApi.getItems(),
          globalEntitiesApi.getSubstitutes(),
        ]);

        setMissions(missionsData);
        setMaterials(materialsData);
        setMethods(methodsData);
        setOutputs(outputsData);
        setItems(itemsData);
        setSubstitutes(substitutesData);

        // If missionId provided in URL, select that mission
        if (missionId) {
          const mission = missionsData.find((m: any) => m.id === missionId);
          if (mission) {
            setSelectedMission(mission);
            // Initialize weekly resources for the selected mission
            const weeklyResources = Array.from(
              { length: mission.duration_weeks },
              (_, i) => ({
                week: i + 1,
                crewAvailable: mission.crew_hours_per_week || 40,
                energyAvailable: 100,
              })
            );
            setWizardState((prev) => ({ ...prev, weeklyResources }));
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [missionId]);

  const handleNext = async () => {
    if (currentStep === 1) {
      // Create job on first step and navigate to [job_id] page
      if (!selectedMission || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        // Create new job
        const jobData: JobCreateRequest = {
          mission_id: missionId!,
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
            name: wizardState.jobName,
            description: wizardState.jobDescription,
          },
        };

        const createdJob = await jobsApi.createJob(jobData);

        // Navigate to the [job_id] page with mission parameter
        router.push(`/jobs/${createdJob.id}?mission=${missionId}`);
      } catch (err) {
        console.error("Failed to create job:", err);
        setError(err instanceof Error ? err.message : "Failed to create job");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (missionId) {
      router.push(`/optimizer?mission=${missionId}`);
    } else {
      router.push("/jobs");
    }
  };

  // handleStepSubmission removed - only handle step 1 in new job page

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return wizardState.jobName.trim().length > 0; // Mission is optional
      case 2:
        return (
          wizardState.selectedMaterials.length > 0 ||
          wizardState.selectedMethods.length > 0 ||
          wizardState.selectedOutputs.length > 0 ||
          wizardState.selectedItems.length > 0 ||
          wizardState.selectedSubstitutes.length > 0
        );
      case 3:
      case 4:
      case 5:
        return true; // These steps are optional
      case 6:
        return true;
      default:
        return false;
    }
  };

  // handleRunJob removed - jobs are run in [job_id] page

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <MdArrowBack className="w-4 h-4 mr-2" />
            Back to Optimizer
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">
                Loading mission and entity data...
              </p>
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
            Back to Optimizer
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

  if (!selectedMission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
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
    );
  }

  const currentStepData = STEPS[currentStep - 1];
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleCancel}>
          <MdArrowBack className="w-4 h-4 mr-2" />
          Back to Optimizer
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Create Optimization Job
          </h1>
          <p className="text-muted-foreground mt-1">
            For mission:{" "}
            <span className="font-semibold">{selectedMission.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MdSettings className="w-5 h-5" />
          <span className="text-sm">
            Step {currentStep} of {STEPS.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{currentStepData.title}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 text-xs ${
                    step.id === currentStep
                      ? "text-primary font-medium"
                      : step.id < currentStep
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? (
                    <MdCheck className="w-4 h-4" />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        step.id === currentStep
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Job Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobName">Job Name *</Label>
                <Input
                  id="jobName"
                  placeholder="Enter a descriptive name for this job"
                  value={wizardState.jobName}
                  onChange={(e) =>
                    setWizardState((prev) => ({
                      ...prev,
                      jobName: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Describe the goals and requirements for this optimization job..."
                  value={wizardState.jobDescription}
                  onChange={(e) =>
                    setWizardState((prev) => ({
                      ...prev,
                      jobDescription: e.target.value,
                    }))
                  }
                  className="w-full min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="missionSelect">Mission (Optional)</Label>
                <Select
                  value={wizardState.selectedMissionId}
                  onValueChange={(value) => {
                    setWizardState((prev) => ({
                      ...prev,
                      selectedMissionId: value,
                    }));

                    // Update selected mission and weekly resources when mission changes
                    const mission = missions.find((m) => m.id === value);
                    setSelectedMission(mission || null);

                    if (mission) {
                      const weeklyResources = Array.from(
                        { length: mission.duration_weeks },
                        (_, i) => ({
                          week: i + 1,
                          crewAvailable: mission.crew_hours_per_week || 40,
                          energyAvailable: 100,
                        })
                      );
                      setWizardState((prev) => ({ ...prev, weeklyResources }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a mission (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.name} ({mission.duration_weeks} weeks)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMission && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Selected Mission Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mission:</span>
                      <div className="font-medium">{selectedMission.name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">
                        {selectedMission.duration_weeks} weeks
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Crew Size:</span>
                      <div className="font-medium">
                        {selectedMission.crew_count} members
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="font-medium">
                        {selectedMission.status}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Entities */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Materials */}
              <div className="space-y-3">
                <h4 className="font-medium">
                  Materials ({materials.length} available)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-input rounded p-3 bg-background">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`material-${material.id}`}
                        checked={wizardState.selectedMaterials.includes(
                          material.id
                        )}
                        onCheckedChange={(checked) => {
                          setWizardState((prev) => ({
                            ...prev,
                            selectedMaterials: checked
                              ? [...prev.selectedMaterials, material.id]
                              : prev.selectedMaterials.filter(
                                  (id) => id !== material.id
                                ),
                          }));
                        }}
                      />
                      <Label
                        htmlFor={`material-${material.id}`}
                        className="text-sm"
                      >
                        {material.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {material.category}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {wizardState.selectedMaterials.length} materials
                </p>
              </div>

              {/* Methods */}
              <div className="space-y-3">
                <h4 className="font-medium">
                  Methods ({methods.length} available)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-input rounded p-3 bg-background">
                  {methods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`method-${method.id}`}
                        checked={wizardState.selectedMethods.includes(
                          method.id
                        )}
                        onCheckedChange={(checked) => {
                          setWizardState((prev) => ({
                            ...prev,
                            selectedMethods: checked
                              ? [...prev.selectedMethods, method.id]
                              : prev.selectedMethods.filter(
                                  (id) => id !== method.id
                                ),
                          }));
                        }}
                      />
                      <Label
                        htmlFor={`method-${method.id}`}
                        className="text-sm"
                      >
                        {method.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {method.category}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {wizardState.selectedMethods.length} methods
                </p>
              </div>

              {/* Outputs */}
              <div className="space-y-3">
                <h4 className="font-medium">
                  Outputs ({outputs.length} available)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-input rounded p-3 bg-background">
                  {outputs.map((output) => (
                    <div
                      key={output.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`output-${output.id}`}
                        checked={wizardState.selectedOutputs.includes(
                          output.id
                        )}
                        onCheckedChange={(checked) => {
                          setWizardState((prev) => ({
                            ...prev,
                            selectedOutputs: checked
                              ? [...prev.selectedOutputs, output.id]
                              : prev.selectedOutputs.filter(
                                  (id) => id !== output.id
                                ),
                          }));
                        }}
                      />
                      <Label
                        htmlFor={`output-${output.id}`}
                        className="text-sm"
                      >
                        {output.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {output.category}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {wizardState.selectedOutputs.length} outputs
                </p>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-medium">
                  Items ({items.length} available)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-input rounded p-3 bg-background">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={wizardState.selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => {
                          setWizardState((prev) => ({
                            ...prev,
                            selectedItems: checked
                              ? [...prev.selectedItems, item.id]
                              : prev.selectedItems.filter(
                                  (id) => id !== item.id
                                ),
                          }));
                        }}
                      />
                      <Label htmlFor={`item-${item.id}`} className="text-sm">
                        {item.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {item.category}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {wizardState.selectedItems.length} items
                </p>
              </div>

              {/* Substitutes */}
              <div className="space-y-3">
                <h4 className="font-medium">
                  Substitutes ({substitutes.length} available)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-input rounded p-3 bg-background">
                  {substitutes.map((substitute) => (
                    <div
                      key={substitute.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`substitute-${substitute.id}`}
                        checked={wizardState.selectedSubstitutes.includes(
                          substitute.id
                        )}
                        onCheckedChange={(checked) => {
                          setWizardState((prev) => ({
                            ...prev,
                            selectedSubstitutes: checked
                              ? [...prev.selectedSubstitutes, substitute.id]
                              : prev.selectedSubstitutes.filter(
                                  (id) => id !== substitute.id
                                ),
                          }));
                        }}
                      />
                      <Label
                        htmlFor={`substitute-${substitute.id}`}
                        className="text-sm"
                      >
                        {substitute.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {substitute.category}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {wizardState.selectedSubstitutes.length} substitutes
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Set Inventories */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Configure initial inventory levels for selected entities. Leave
                empty or 0 for no initial inventory.
              </p>

              {/* Material Inventories */}
              {wizardState.selectedMaterials.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Material Inventories (kg)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wizardState.selectedMaterials.map((materialId) => {
                      const material = materials.find(
                        (m) => m.id === materialId
                      );
                      return (
                        <div key={materialId} className="space-y-2">
                          <Label>{material?.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="0.0"
                            value={
                              wizardState.materialInventories[materialId] || ""
                            }
                            onChange={(e) =>
                              setWizardState((prev) => ({
                                ...prev,
                                materialInventories: {
                                  ...prev.materialInventories,
                                  [materialId]: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Output Inventories */}
              {wizardState.selectedOutputs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Output Inventories (kg)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wizardState.selectedOutputs.map((outputId) => {
                      const output = outputs.find((o) => o.id === outputId);
                      return (
                        <div key={outputId} className="space-y-2">
                          <Label>{output?.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="0.0"
                            value={
                              wizardState.outputInventories[outputId] || ""
                            }
                            onChange={(e) =>
                              setWizardState((prev) => ({
                                ...prev,
                                outputInventories: {
                                  ...prev.outputInventories,
                                  [outputId]: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Item Inventories */}
              {wizardState.selectedItems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Item Inventories (units)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wizardState.selectedItems.map((itemId) => {
                      const item = items.find((i) => i.id === itemId);
                      return (
                        <div key={itemId} className="space-y-2">
                          <Label>{item?.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={wizardState.itemInventories[itemId] || ""}
                            onChange={(e) =>
                              setWizardState((prev) => ({
                                ...prev,
                                itemInventories: {
                                  ...prev.itemInventories,
                                  [itemId]: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Substitute Inventories */}
              {wizardState.selectedSubstitutes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">
                    Substitute Inventories (units)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wizardState.selectedSubstitutes.map((substituteId) => {
                      const substitute = substitutes.find(
                        (s) => s.id === substituteId
                      );
                      return (
                        <div key={substituteId} className="space-y-2">
                          <Label>{substitute?.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={
                              wizardState.substituteInventories[substituteId] ||
                              ""
                            }
                            onChange={(e) =>
                              setWizardState((prev) => ({
                                ...prev,
                                substituteInventories: {
                                  ...prev.substituteInventories,
                                  [substituteId]:
                                    parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Demands & Deadlines */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Configure item demands and deadlines for the optimization. This
                step is optional but helps guide the optimization process.
              </p>

              {wizardState.selectedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No items selected in Step 2.</p>
                  <p className="text-xs mt-2">
                    You need to select items first to configure demands and
                    deadlines.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Item Demands */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item Demands</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWizardState((prev) => ({
                            ...prev,
                            itemDemands: [
                              ...prev.itemDemands,
                              {
                                itemId: wizardState.selectedItems[0],
                                week: 1,
                                amount: 1,
                              },
                            ],
                          }));
                        }}
                        disabled={wizardState.selectedItems.length === 0}
                      >
                        Add Demand
                      </Button>
                    </div>

                    {wizardState.itemDemands.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm border border-dashed border-input rounded">
                        No demands configured. Click "Add Demand" to add item
                        demands.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {wizardState.itemDemands.map((demand, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 border border-input rounded bg-background"
                          >
                            <div className="flex-1">
                              <Label className="text-xs">Item</Label>
                              <select
                                value={demand.itemId}
                                onChange={(e) => {
                                  const newDemands = [
                                    ...wizardState.itemDemands,
                                  ];
                                  newDemands[index].itemId = e.target.value;
                                  setWizardState((prev) => ({
                                    ...prev,
                                    itemDemands: newDemands,
                                  }));
                                }}
                                className="w-full mt-1 px-3 py-2 border border-input rounded text-sm bg-background"
                              >
                                {wizardState.selectedItems.map((itemId) => {
                                  const item = items.find(
                                    (i) => i.id === itemId
                                  );
                                  return (
                                    <option key={itemId} value={itemId}>
                                      {item?.name}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                            <div className="w-20">
                              <Label className="text-xs">Week</Label>
                              <Input
                                type="number"
                                min="1"
                                max={selectedMission.duration_weeks}
                                value={demand.week}
                                onChange={(e) => {
                                  const newDemands = [
                                    ...wizardState.itemDemands,
                                  ];
                                  newDemands[index].week =
                                    parseInt(e.target.value) || 1;
                                  setWizardState((prev) => ({
                                    ...prev,
                                    itemDemands: newDemands,
                                  }));
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div className="w-24">
                              <Label className="text-xs">Amount</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={demand.amount}
                                onChange={(e) => {
                                  const newDemands = [
                                    ...wizardState.itemDemands,
                                  ];
                                  newDemands[index].amount =
                                    parseFloat(e.target.value) || 0;
                                  setWizardState((prev) => ({
                                    ...prev,
                                    itemDemands: newDemands,
                                  }));
                                }}
                                className="mt-1"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newDemands =
                                  wizardState.itemDemands.filter(
                                    (_, i) => i !== index
                                  );
                                setWizardState((prev) => ({
                                  ...prev,
                                  itemDemands: newDemands,
                                }));
                              }}
                              className="mt-5"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item Deadlines */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item Deadlines</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWizardState((prev) => ({
                            ...prev,
                            itemDeadlines: [
                              ...prev.itemDeadlines,
                              {
                                itemId: wizardState.selectedItems[0],
                                week: selectedMission.duration_weeks,
                                amount: 1,
                              },
                            ],
                          }));
                        }}
                        disabled={wizardState.selectedItems.length === 0}
                      >
                        Add Deadline
                      </Button>
                    </div>

                    {wizardState.itemDeadlines.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm border border-dashed border-input rounded">
                        No deadlines configured. Click "Add Deadline" to add
                        item deadlines.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {wizardState.itemDeadlines.map((deadline, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 border border-input rounded bg-background"
                          >
                            <div className="flex-1">
                              <Label className="text-xs">Item</Label>
                              <select
                                value={deadline.itemId}
                                onChange={(e) => {
                                  const newDeadlines = [
                                    ...wizardState.itemDeadlines,
                                  ];
                                  newDeadlines[index].itemId = e.target.value;
                                  setWizardState((prev) => ({
                                    ...prev,
                                    itemDeadlines: newDeadlines,
                                  }));
                                }}
                                className="w-full mt-1 px-3 py-2 border border-input rounded text-sm bg-background"
                              >
                                {wizardState.selectedItems.map((itemId) => {
                                  const item = items.find(
                                    (i) => i.id === itemId
                                  );
                                  return (
                                    <option key={itemId} value={itemId}>
                                      {item?.name}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                            <div className="w-20">
                              <Label className="text-xs">Week</Label>
                              <Input
                                type="number"
                                min="1"
                                max={selectedMission.duration_weeks}
                                value={deadline.week}
                                onChange={(e) => {
                                  const newDeadlines = [
                                    ...wizardState.itemDeadlines,
                                  ];
                                  newDeadlines[index].week =
                                    parseInt(e.target.value) || 1;
                                  setWizardState((prev) => ({
                                    ...prev,
                                    itemDeadlines: newDeadlines,
                                  }));
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div className="w-24">
                              <Label className="text-xs">Amount</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={deadline.amount}
                                onChange={(e) => {
                                  const newDeadlines = [
                                    ...wizardState.itemDeadlines,
                                  ];
                                  newDeadlines[index].amount =
                                    parseFloat(e.target.value) || 0;
                                  setWizardState((prev) => ({
                                    ...prev,
                                    itemDeadlines: newDeadlines,
                                  }));
                                }}
                                className="mt-1"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newDeadlines =
                                  wizardState.itemDeadlines.filter(
                                    (_, i) => i !== index
                                  );
                                setWizardState((prev) => ({
                                  ...prev,
                                  itemDeadlines: newDeadlines,
                                }));
                              }}
                              className="mt-5"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Resources & Capacity */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Configure weekly resources and method capacities. Default values
                are pre-filled based on mission parameters.
              </p>

              <div className="space-y-6">
                {/* Weekly Resources */}
                <div className="space-y-4">
                  <h4 className="font-medium">Weekly Resources</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto border border-border rounded p-3 bg-background">
                    {wizardState.weeklyResources.map((resource, index) => (
                      <div
                        key={resource.week}
                        className="flex items-center gap-3 p-3 border border-input rounded bg-muted/20"
                      >
                        <div className="w-16">
                          <Label className="text-xs">
                            Week {resource.week}
                          </Label>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">
                            Crew Available (hours)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={resource.crewAvailable}
                            onChange={(e) => {
                              const newResources = [
                                ...wizardState.weeklyResources,
                              ];
                              newResources[index].crewAvailable =
                                parseFloat(e.target.value) || 0;
                              setWizardState((prev) => ({
                                ...prev,
                                weeklyResources: newResources,
                              }));
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">
                            Energy Available (units)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={resource.energyAvailable}
                            onChange={(e) => {
                              const newResources = [
                                ...wizardState.weeklyResources,
                              ];
                              newResources[index].energyAvailable =
                                parseFloat(e.target.value) || 0;
                              setWizardState((prev) => ({
                                ...prev,
                                weeklyResources: newResources,
                              }));
                            }}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Method Capacities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Method Capacities</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (wizardState.selectedMethods.length > 0) {
                          setWizardState((prev) => ({
                            ...prev,
                            methodCapacities: [
                              ...prev.methodCapacities,
                              {
                                methodId: wizardState.selectedMethods[0],
                                week: 1,
                                maxCapacityKg: 10,
                                available: true,
                              },
                            ],
                          }));
                        }
                      }}
                      disabled={wizardState.selectedMethods.length === 0}
                    >
                      Add Method Capacity
                    </Button>
                  </div>

                  {wizardState.selectedMethods.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm border border-dashed border-input rounded">
                      No methods selected in Step 2. You need to select methods
                      first to configure capacities.
                    </div>
                  ) : wizardState.methodCapacities.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm border border-dashed border-input rounded">
                      No method capacities configured. Click "Add Method
                      Capacity" to configure method capacities.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto border border-input rounded p-3 bg-background">
                      {wizardState.methodCapacities.map((capacity, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border border-input rounded bg-background"
                        >
                          <div className="flex-1">
                            <Label className="text-xs">Method</Label>
                            <select
                              value={capacity.methodId}
                              onChange={(e) => {
                                const newCapacities = [
                                  ...wizardState.methodCapacities,
                                ];
                                newCapacities[index].methodId = e.target.value;
                                setWizardState((prev) => ({
                                  ...prev,
                                  methodCapacities: newCapacities,
                                }));
                              }}
                              className="w-full mt-1 px-3 py-2 border border-border rounded text-sm bg-background"
                            >
                              {wizardState.selectedMethods.map((methodId) => {
                                const method = methods.find(
                                  (m) => m.id === methodId
                                );
                                return (
                                  <option key={methodId} value={methodId}>
                                    {method?.name}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div className="w-20">
                            <Label className="text-xs">Week</Label>
                            <Input
                              type="number"
                              min="1"
                              max={selectedMission.duration_weeks}
                              value={capacity.week}
                              onChange={(e) => {
                                const newCapacities = [
                                  ...wizardState.methodCapacities,
                                ];
                                newCapacities[index].week =
                                  parseInt(e.target.value) || 1;
                                setWizardState((prev) => ({
                                  ...prev,
                                  methodCapacities: newCapacities,
                                }));
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div className="w-28">
                            <Label className="text-xs">Max Capacity (kg)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={capacity.maxCapacityKg}
                              onChange={(e) => {
                                const newCapacities = [
                                  ...wizardState.methodCapacities,
                                ];
                                newCapacities[index].maxCapacityKg =
                                  parseFloat(e.target.value) || 0;
                                setWizardState((prev) => ({
                                  ...prev,
                                  methodCapacities: newCapacities,
                                }));
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div className="w-20">
                            <Label className="text-xs">Available</Label>
                            <div className="mt-1">
                              <Checkbox
                                checked={capacity.available}
                                onCheckedChange={(checked) => {
                                  const newCapacities = [
                                    ...wizardState.methodCapacities,
                                  ];
                                  newCapacities[index].available =
                                    checked as boolean;
                                  setWizardState((prev) => ({
                                    ...prev,
                                    methodCapacities: newCapacities,
                                  }));
                                }}
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newCapacities =
                                wizardState.methodCapacities.filter(
                                  (_, i) => i !== index
                                );
                              setWizardState((prev) => ({
                                ...prev,
                                methodCapacities: newCapacities,
                              }));
                            }}
                            className="mt-5"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Fill Options */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Quick Fill Options</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const capacities: Array<{
                          methodId: string;
                          week: number;
                          maxCapacityKg: number;
                          available: boolean;
                        }> = [];
                        for (const methodId of wizardState.selectedMethods) {
                          for (
                            let week = 1;
                            week <= selectedMission.duration_weeks;
                            week++
                          ) {
                            capacities.push({
                              methodId,
                              week,
                              maxCapacityKg: 10,
                              available: true,
                            });
                          }
                        }
                        setWizardState((prev) => ({
                          ...prev,
                          methodCapacities: capacities,
                        }));
                      }}
                      disabled={wizardState.selectedMethods.length === 0}
                    >
                      Fill All Methods & Weeks (10kg)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWizardState((prev) => ({
                          ...prev,
                          methodCapacities: [],
                        }));
                      }}
                    >
                      Clear All Capacities
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Run */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-4">Job Configuration Summary</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Job Details</h5>
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{" "}
                        {wizardState.jobName}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mission:</span>{" "}
                        {selectedMission.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>{" "}
                        {selectedMission.duration_weeks} weeks
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Selected Entities</h5>
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">
                          Materials:
                        </span>{" "}
                        {wizardState.selectedMaterials.length}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Methods:</span>{" "}
                        {wizardState.selectedMethods.length}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Outputs:</span>{" "}
                        {wizardState.selectedOutputs.length}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Items:</span>{" "}
                        {wizardState.selectedItems.length}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Substitutes:
                        </span>{" "}
                        {wizardState.selectedSubstitutes.length}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Configuration Summary</h5>
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">
                          Inventories:
                        </span>{" "}
                        {Object.keys(wizardState.materialInventories).length +
                          Object.keys(wizardState.outputInventories).length +
                          Object.keys(wizardState.itemInventories).length +
                          Object.keys(wizardState.substituteInventories)
                            .length}{" "}
                        configured
                      </div>
                      <div>
                        <span className="text-muted-foreground">Demands:</span>{" "}
                        {wizardState.itemDemands.length} configured
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Deadlines:
                        </span>{" "}
                        {wizardState.itemDeadlines.length} configured
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Method Capacities:
                        </span>{" "}
                        {wizardState.methodCapacities.length} configured
                      </div>
                    </div>
                  </div>
                </div>

                {wizardState.jobDescription && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Description</h5>
                    <p className="text-muted-foreground text-sm">
                      {wizardState.jobDescription}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="font-medium">Error:</span>
                      <span>{error}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <MdNavigateBefore className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={handleNext}
            disabled={!isStepValid(currentStep) || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? "Creating Job..." : "Create Job"}
            <MdNavigateNext className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
