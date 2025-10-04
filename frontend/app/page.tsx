import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MdRocket, MdRestaurantMenu, MdInventory, MdWork, MdTrendingUp } from "react-icons/md"

const stats = [
  { name: "Active Missions", value: "12", icon: MdRocket, change: "+2 this week", trend: "up", color: "blue" },
  { name: "Total Recipes", value: "847", icon: MdRestaurantMenu, change: "+34 this month", trend: "up", color: "green" },
  { name: "Planned Items", value: "2,341", icon: MdInventory, change: "Across all missions", trend: "stable", color: "orange" },
  { name: "Pending Jobs", value: "156", icon: MdWork, change: "23 in progress", trend: "down", color: "purple" },
]

const missionUpdates = [
  { 
    id: "ALPHA-001", 
    name: "Artemis Base Setup", 
    status: "In Progress", 
    progress: 78, 
    lastUpdate: "2h ago",
    priority: "high",
    crew: 4
  },
  { 
    id: "BETA-002", 
    name: "Resource Extraction", 
    status: "Planning", 
    progress: 23, 
    lastUpdate: "4h ago",
    priority: "medium",
    crew: 6
  },
  { 
    id: "GAMMA-003", 
    name: "Habitat Construction", 
    status: "Active", 
    progress: 56, 
    lastUpdate: "1h ago",
    priority: "high",
    crew: 8
  },
]

export default function DashboardPage() {
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

      {/* Enhanced stats cards with NASA styling */}
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
            <div className="space-y-4">
              {missionUpdates.map((mission) => (
                <div key={mission.id} className="p-4 bg-secondary/30 rounded-lg border border-border/30 relative overflow-hidden group hover:border-primary/30 transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-accent/50 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-technical text-primary bg-primary/10 px-2 py-1 rounded">{mission.id}</span>
                        {mission.priority === "high" && (
                          <span className="text-xs font-technical text-accent bg-accent/10 px-2 py-1 rounded">HIGH</span>
                        )}
                      </div>
                      <p className="font-medium text-foreground mt-1">{mission.name}</p>
                      <p className="text-sm text-muted-foreground font-technical">Status: {mission.status} • Crew: {mission.crew}</p>
                    </div>
                    <div className="text-sm text-muted-foreground font-technical">{mission.lastUpdate}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-technical">Progress</span>
                      <span className="text-foreground font-technical">{mission.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 animate-data-flow"
                        style={{ width: `${mission.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <div className="text-xs font-technical text-accent">3 ACTIVE</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-400 font-technical">SCHEDULER OPTIMIZATION COMPLETE</p>
                    <p className="text-xs text-muted-foreground mt-1 font-technical">All jobs scheduled successfully • Performance: +12%</p>
                  </div>
                  <span className="text-xs text-blue-400 font-technical">02:34 UTC</span>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-400 font-technical">RECIPE VALIDATION PENDING</p>
                    <p className="text-xs text-muted-foreground mt-1 font-technical">3 recipes require review • Priority: Medium</p>
                  </div>
                  <span className="text-xs text-yellow-400 font-technical">01:22 UTC</span>
                </div>
              </div>
              
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-400"></div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-400 font-technical">SYSTEM BACKUP COMPLETED</p>
                    <p className="text-xs text-muted-foreground mt-1 font-technical">All data secured • Next backup: 24h</p>
                  </div>
                  <span className="text-xs text-green-400 font-technical">00:15 UTC</span>
                </div>
              </div>
            </div>
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
