import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MdCompareArrows } from "react-icons/md"

export default function DiffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Diff Viewer</h1>
          <p className="text-muted-foreground mt-1">Compare and analyze mission differences</p>
        </div>
        <Button className="gap-2">
          <MdCompareArrows className="w-5 h-5" />
          New Comparison
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Tool</CardTitle>
          <CardDescription>Side-by-side mission and data comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-secondary rounded-lg">
            <p className="text-muted-foreground">Diff comparison interface coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
