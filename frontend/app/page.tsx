import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MdRocket, MdRestaurantMenu, MdInventory, MdWork } from "react-icons/md"

const stats = [
  { name: "Active Missions", value: "12", icon: MdRocket, change: "+2 this week" },
  { name: "Total Recipes", value: "847", icon: MdRestaurantMenu, change: "+34 this month" },
  { name: "Planned Items", value: "2,341", icon: MdInventory, change: "Across all missions" },
  { name: "Pending Jobs", value: "156", icon: MdWork, change: "23 in progress" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mission Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of Mars operations and mission status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                <Icon className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Missions</CardTitle>
            <CardDescription>Latest mission activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <MdRocket className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Mission Alpha-{i}</p>
                    <p className="text-sm text-muted-foreground">Status: In Progress</p>
                  </div>
                  <div className="text-sm text-muted-foreground">2h ago</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Important notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-medium text-blue-400">Scheduler optimization complete</p>
                <p className="text-xs text-muted-foreground mt-1">All jobs scheduled successfully</p>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm font-medium text-yellow-400">Recipe validation pending</p>
                <p className="text-xs text-muted-foreground mt-1">3 recipes require review</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-medium text-green-400">System backup completed</p>
                <p className="text-xs text-muted-foreground mt-1">All data secured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
