import { MissionTable } from "./components/MissionTable"

export default function MissionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Missions</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all Mars missions</p>
        </div>
      </div>

      <MissionTable />
    </div>
  )
}
