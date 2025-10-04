import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MdTrendingUp, MdRecycling, MdSecurity, MdSpeed } from "react-icons/md"
import type { OptimizationDiff } from "@/types/jobs"

interface OptimizationChartsProps {
  diff: OptimizationDiff
  optimizedSchedule?: {
    totalWasteReduced?: string
    energyEfficiency?: string
    crewUtilization?: string
  }
}

export default function OptimizationCharts({ diff, optimizedSchedule }: OptimizationChartsProps) {
  // Calculate category-wise mass changes
  const categoryChanges = diff.materialChanges.reduce((acc, change) => {
    if (!acc[change.category]) {
      acc[change.category] = { total: 0, count: 0, items: [] }
    }
    acc[change.category].total += Math.abs(change.change)
    acc[change.category].count += 1
    acc[change.category].items.push({
      name: change.itemName,
      change: change.change,
      unit: change.unit,
      changeType: change.changeType
    })
    return acc
  }, {} as Record<string, { total: number; count: number; items: Array<{name: string; change: number; unit: string; changeType: string}> }>)

  // Impact distribution
  const impactDistribution = diff.materialChanges.reduce((acc, change) => {
    acc[change.impactType] = (acc[change.impactType] || 0) + Math.abs(change.change)
    return acc
  }, {} as Record<string, number>)

  const maxImpactValue = Math.max(...Object.values(impactDistribution))

  return (
    <div className="space-y-6">
      {/* Performance Metrics Chart */}
      {optimizedSchedule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MdTrendingUp className="w-5 h-5" />
              Performance Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MdRecycling className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Waste Reduced</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {optimizedSchedule.totalWasteReduced}
                </div>
                <Progress 
                  value={parseInt(optimizedSchedule.totalWasteReduced?.replace('%', '') || '0')} 
                  className="w-full h-2" 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MdSpeed className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Energy Efficiency</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {optimizedSchedule.energyEfficiency}
                </div>
                <Progress 
                  value={parseInt(optimizedSchedule.energyEfficiency?.replace('%', '') || '0')} 
                  className="w-full h-2" 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MdSecurity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Crew Utilization</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {optimizedSchedule.crewUtilization}
                </div>
                <Progress 
                  value={parseInt(optimizedSchedule.crewUtilization?.replace('%', '') || '0')} 
                  className="w-full h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Impact Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(impactDistribution).map(([impact, value]) => {
              const percentage = (value / maxImpactValue) * 100
              const getImpactColor = (impactType: string) => {
                switch (impactType) {
                  case 'mass_saving': return 'bg-green-500'
                  case 'recycling_gain': return 'bg-blue-500'
                  case 'safety_improvement': return 'bg-red-500'
                  case 'efficiency_gain': return 'bg-purple-500'
                  default: return 'bg-gray-500'
                }
              }
              
              return (
                <div key={impact} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {impact.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {value.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getImpactColor(impact)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Material Category Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(categoryChanges).map(([category, data]) => (
              <div key={category} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{category}</h4>
                  <span className="text-sm text-muted-foreground">
                    {data.count} item{data.count !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid gap-2">
                  {data.items.map((item, index) => {
                    const isReduction = item.change < 0
                    const isAddition = item.changeType === 'added'
                    
                    return (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isReduction ? 'bg-green-500' : 
                            isAddition ? 'bg-purple-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          isReduction ? 'text-green-600' : 
                          isAddition ? 'text-purple-600' : 'text-blue-600'
                        }`}>
                          {item.change > 0 ? '+' : ''}{item.change.toLocaleString()} {item.unit}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  )
}