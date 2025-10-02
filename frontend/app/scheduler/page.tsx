import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MdPlayArrow } from "react-icons/md"

export default function SchedulerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scheduler</h1>
          <p className="text-muted-foreground mt-1">Optimize and schedule mission operations</p>
        </div>
        <Button className="gap-2">
          <MdPlayArrow className="w-5 h-5" />
          Run Scheduler
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Optimization</CardTitle>
          <CardDescription>Automated job scheduling and resource allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-secondary rounded-lg">
            <p className="text-muted-foreground">Scheduler interface coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
