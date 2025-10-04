"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MdRocket, MdRestaurantMenu, MdInventory, MdWork, MdTrendingUp } from "react-icons/md"
import { metricsApi, type MetricsSummary } from "@/lib/api/metrics"
import { missionsApi, type Mission } from "@/lib/api/missions"
import { toast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [activeMissions, setActiveMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch metrics summary
        const metricsData = await metricsApi.getSummary()
        setMetrics(metricsData)
        
        // Fetch all missions and filter for active ones
        const missionsData = await missionsApi.getMissions()
        const runningMissions = missionsData.filter(mission => mission.status === 'Running')
        setActiveMissions(runningMissions)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data'
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Create stats from real metrics data
  const stats = metrics ? [
    { 
      name: "Active Missions", 
      value: metrics.active_missions.count.toString(), 
      icon: MdRocket, 
      change: metrics.active_missions.delta ? `+${metrics.active_missions.delta} this week` : "No new missions", 
      trend: metrics.active_missions.delta && metrics.active_missions.delta > 0 ? "up" : "stable", 
      color: "blue" 
    },
    { 
      name: "Total Recipes", 
      value: metrics.total_recipes.count.toString(), 
      icon: MdRestaurantMenu, 
      change: metrics.total_recipes.delta ? `+${metrics.total_recipes.delta} this month` : "No new recipes", 
      trend: metrics.total_recipes.delta && metrics.total_recipes.delta > 0 ? "up" : "stable", 
      color: "green" 
    },
    { 
      name: "Planned Items", 
      value: metrics.planned_items.count.toString(), 
      icon: MdInventory, 
      change: "Across all missions", 
      trend: "stable", 
      color: "orange" 
    },
    { 
      name: "Pending Jobs", 
      value: metrics.pending_jobs.count.toString(), 
      icon: MdWork, 
      change: metrics.pending_jobs.extra ? `${metrics.pending_jobs.extra} in progress` : "No jobs in progress", 
      trend: metrics.pending_jobs.count > 0 ? "up" : "stable", 
      color: "purple" 
    },
  ] : []
  return (
    <div className="space-y-6">
      {/* Header with NASA-style typography */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4">MISSION DASHBOARD</h1>
        <p className="text-muted-foreground mt-2 font-technical tracking-wide">
          Real-time overview of Mars operations and mission status • Sol 1247
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 w-8 bg-muted rounded-lg"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/10">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <p className="text-destructive font-medium">Failed to load dashboard data</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced stats cards with NASA styling */}
      {!loading && !error && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.name} className="mission-card-glow border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground font-technical uppercase tracking-wider">{stat.name}</CardTitle>
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-end gap-2">
                    <div className="text-3xl font-bold text-foreground font-technical">{stat.value}</div>
                    {stat.trend === "up" && <MdTrendingUp className="w-4 h-4 text-green-400 mb-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-technical">{stat.change}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Mission Cards */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-technical tracking-wide">ACTIVE MISSIONS</CardTitle>
                <CardDescription className="font-technical text-xs tracking-wider uppercase">Real-time mission status</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-technical text-green-400">LIVE</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : activeMissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active missions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMissions.map((mission) => (
                  <div key={mission.id} className="p-4 bg-secondary/30 rounded-lg border border-border/30 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-accent/50 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-technical text-primary bg-primary/10 px-2 py-1 rounded">{mission.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-xs font-technical text-accent bg-accent/10 px-2 py-1 rounded">{mission.status.toUpperCase()}</span>
                        </div>
                        <p className="font-medium text-foreground mt-1">{mission.name}</p>
                        <p className="text-sm text-muted-foreground font-technical">
                          Duration: {mission.duration_weeks}w • Crew: {mission.crew_count}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground font-technical">
                        {mission.mission_start_date ? new Date(mission.mission_start_date).toLocaleDateString() : 'No date set'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-technical">Surface Phase</span>
                        <span className="text-foreground font-technical">{mission.surface_weeks}w</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((mission.surface_weeks / mission.duration_weeks) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced System Alerts */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-technical tracking-wide">SYSTEM ALERTS</CardTitle>
                <CardDescription className="font-technical text-xs tracking-wider uppercase">Critical notifications & warnings</CardDescription>
              </div>
              <div className="text-xs font-technical text-accent">
                {!loading && metrics ? 
                  `${(metrics.pending_jobs.count || 0) + (metrics.pending_jobs.extra || 0)} ACTIVE` : 
                  'LOADING...'
                }
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Metrics-based alerts */}
                {metrics && metrics.active_missions.count > 0 && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-400 font-technical">ACTIVE MISSIONS RUNNING</p>
                        <p className="text-xs text-muted-foreground mt-1 font-technical">
                          {metrics.active_missions.count} mission{metrics.active_missions.count > 1 ? 's' : ''} currently active
                          {metrics.active_missions.delta && metrics.active_missions.delta > 0 && 
                            ` • ${metrics.active_missions.delta} new this week`
                          }
                        </p>
                      </div>
                      <span className="text-xs text-blue-400 font-technical">LIVE</span>
                    </div>
                  </div>
                )}
                
                {metrics && metrics.pending_jobs.count > 0 && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-400 font-technical">PENDING JOBS QUEUE</p>
                        <p className="text-xs text-muted-foreground mt-1 font-technical">
                          {metrics.pending_jobs.count} job{metrics.pending_jobs.count > 1 ? 's' : ''} awaiting execution
                          {metrics.pending_jobs.extra && metrics.pending_jobs.extra > 0 && 
                            ` • ${metrics.pending_jobs.extra} in progress`
                          }
                        </p>
                      </div>
                      <span className="text-xs text-yellow-400 font-technical">PRIORITY</span>
                    </div>
                  </div>
                )}

                {metrics && metrics.total_recipes.delta && metrics.total_recipes.delta > 0 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-400"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-400 font-technical">NEW RECIPES ADDED</p>
                        <p className="text-xs text-muted-foreground mt-1 font-technical">
                          {metrics.total_recipes.delta} new recipe{metrics.total_recipes.delta > 1 ? 's' : ''} added this month • 
                          Total: {metrics.total_recipes.count}
                        </p>
                      </div>
                      <span className="text-xs text-green-400 font-technical">SUCCESS</span>
                    </div>
                  </div>
                )}

                {/* Default message when no significant alerts */}
                {metrics && 
                 metrics.active_missions.count === 0 && 
                 metrics.pending_jobs.count === 0 && 
                 (!metrics.total_recipes.delta || metrics.total_recipes.delta === 0) && (
                  <div className="p-4 bg-secondary/30 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground font-technical">All systems nominal • No critical alerts</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mission Timeline Visualization */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-technical tracking-wide">MISSION TIMELINE</CardTitle>
          <CardDescription className="font-technical text-xs tracking-wider uppercase">Upcoming milestones and objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-primary"></div>
            <div className="space-y-6">
              {[
                { time: "Sol 1248", event: "Habitat Module Deployment", status: "upcoming" },
                { time: "Sol 1250", event: "Resource Survey Mission", status: "scheduled" },
                { time: "Sol 1255", event: "Communication Array Setup", status: "planned" },
              ].map((item, index) => (
                <div key={index} className="relative flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center relative z-10">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.event}</p>
                    <p className="text-sm text-muted-foreground font-technical">{item.time} • Status: {item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
