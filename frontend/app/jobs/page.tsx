import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MdRefresh } from "react-icons/md"

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Center</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all processing jobs</p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <MdRefresh className="w-5 h-5" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Jobs</CardTitle>
          <CardDescription>Current job queue and processing status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-secondary rounded-lg">
            <p className="text-muted-foreground">Job monitoring interface coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
