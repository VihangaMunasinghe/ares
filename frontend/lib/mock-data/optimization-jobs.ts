import type { Job } from "@/types/jobs"

export const mockOptimizationJobs: Job[] = [
  {
    id: "opt-001",
    name: "Resource Allocation Optimization",
    type: "optimization",
    status: "completed",
    progress: 100,
    missionId: "1",
    startedAt: "2025-01-20T10:00:00Z",
    completedAt: "2025-01-20T11:30:00Z",
    createdAt: "2025-01-20T09:45:00Z",
    result: {
      success: true,
      data: {
        optimizedSchedule: {
          totalWasteReduced: "85%",
          energyEfficiency: "92%",
          crewUtilization: "78%"
        },
        optimizationDiff: {
          materialChanges: [
            {
              itemId: "water-001",
              itemName: "Drinking Water",
              category: "Consumables",
              unit: "L",
              before: 1200,
              after: 720,
              change: -480,
              changeType: "reduced",
              justification: "Implemented water recycling system with 85% efficiency, reducing initial water payload by 40%",
              impactType: "mass_saving",
              weekApplied: [4, 8, 12, 16, 20]
            },
            {
              itemId: "food-002",
              itemName: "Meal Packages",
              category: "Food",
              unit: "kg",
              before: 850,
              after: 680,
              change: -170,
              changeType: "reduced",
              justification: "Optimized food packaging and introduced hydroponic system for fresh produce",
              impactType: "mass_saving",
              weekApplied: [6, 10, 14, 18]
            },
            {
              itemId: "plastic-001",
              itemName: "Plastic Containers",
              category: "Packaging",
              unit: "kg",
              before: 120,
              after: 25,
              change: -95,
              changeType: "reduced",
              justification: "Plastic recycling system converts 80% of waste containers into new items and repair materials",
              impactType: "recycling_gain",
              weekApplied: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
            },
            {
              itemId: "tools-001",
              itemName: "3D Printed Tools",
              category: "Equipment",
              unit: "units",
              before: 0,
              after: 45,
              change: 45,
              changeType: "added",
              justification: "On-demand manufacturing reduces need to carry specialized tools, manufactured from recycled materials",
              impactType: "efficiency_gain",
              weekApplied: [3, 7, 11, 15, 19]
            }
          ],
          summary: {
            totalMassSaved: 705,
            totalItemsAffected: 4,
            recyclingTasksAdded: 8,
            safetyImprovements: 2
          },
          justification: {
            primaryStrategy: "Maximize recycling efficiency while maintaining crew safety and mission objectives",
            keyDecisions: [
              "Prioritize water recycling due to high mass impact and proven reliability",
              "Implement plastic recycling early to establish material feedstock for 3D printing",
              "Delay complex food recycling until crew is established in routine"
            ],
            tradeOffs: [
              "Increased crew time for recycling tasks (8 hours/week) vs 705kg mass savings",
              "Initial equipment complexity vs long-term resource independence",
              "Storage space for recycling equipment vs reduced consumable storage needs"
            ]
          }
        }
      },
      metrics: {
        duration: 90,
        itemsProcessed: 156,
        optimizationScore: 8.7
      }
    }
  },
  {
    id: "opt-002", 
    name: "Waste Processing Optimization",
    type: "optimization",
    status: "running",
    progress: 65,
    missionId: "1",
    startedAt: "2025-01-21T14:15:00Z",
    createdAt: "2025-01-21T14:00:00Z",
    result: undefined
  },
  {
    id: "opt-003",
    name: "Crew Schedule Optimization", 
    type: "optimization",
    status: "failed",
    progress: 25,
    missionId: "1",
    startedAt: "2025-01-19T16:00:00Z",
    completedAt: "2025-01-19T16:45:00Z",
    createdAt: "2025-01-19T15:30:00Z",
    error: "Insufficient crew availability data for optimization",
    result: {
      success: false,
      data: {},
      metrics: {
        duration: 45,
        itemsProcessed: 23,
        optimizationScore: 0
      }
    }
  },
  {
    id: "opt-004",
    name: "Mission Phase Optimization",
    type: "optimization", 
    status: "pending",
    progress: 0,
    missionId: "1",
    createdAt: "2025-01-22T08:00:00Z"
  }
]

export const mockOptimizationJobsForMission2: Job[] = [
  {
    id: "opt-005",
    name: "Long-term Resource Planning",
    type: "optimization",
    status: "completed",
    progress: 100,
    missionId: "2",
    startedAt: "2025-02-01T09:00:00Z",
    completedAt: "2025-02-01T12:00:00Z",
    createdAt: "2025-02-01T08:30:00Z",
    result: {
      success: true,
      data: {
        optimizedSchedule: {
          totalWasteReduced: "91%",
          energyEfficiency: "88%",
          crewUtilization: "82%"
        },
        optimizationDiff: {
          materialChanges: [
            {
              itemId: "oxygen-001",
              itemName: "Oxygen Canisters",
              category: "Life Support",
              unit: "kg",
              before: 2400,
              after: 1560,
              change: -840,
              changeType: "reduced",
              justification: "Advanced CO2 scrubbing and oxygen recovery system reduces oxygen supply needs by 35%",
              impactType: "mass_saving",
              weekApplied: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            },
            {
              itemId: "metal-001",
              itemName: "Aluminum Alloy Stock",
              category: "Raw Materials",
              unit: "kg",
              before: 200,
              after: 50,
              change: -150,
              changeType: "reduced",
              justification: "Metal recycling from food containers and equipment provides 75% of manufacturing needs",
              impactType: "recycling_gain",
              weekApplied: [2, 5, 8, 11, 14, 17, 20]
            },
            {
              itemId: "spare-parts-001",
              itemName: "Critical Spare Parts",
              category: "Maintenance",
              unit: "units",
              before: 85,
              after: 125,
              change: 40,
              changeType: "added",
              justification: "On-demand manufacturing of spare parts from recycled materials increases mission resilience",
              impactType: "safety_improvement",
              weekApplied: [4, 8, 12, 16, 20, 24]
            }
          ],
          summary: {
            totalMassSaved: 990,
            totalItemsAffected: 3,
            recyclingTasksAdded: 12,
            safetyImprovements: 5
          },
          justification: {
            primaryStrategy: "Long-term sustainability through closed-loop resource management",
            keyDecisions: [
              "Prioritize life support optimization for maximum safety margin",
              "Establish comprehensive metal recycling for manufacturing capabilities",
              "Overproduction of critical spare parts to ensure mission continuity"
            ],
            tradeOffs: [
              "Higher initial equipment mass vs dramatic long-term savings",
              "Complex recycling procedures vs resource independence",
              "Crew training time for new systems vs operational efficiency gains"
            ]
          }
        }
      },
      metrics: {
        duration: 180,
        itemsProcessed: 298,
        optimizationScore: 9.2
      }
    }
  }
]
