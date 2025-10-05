import { MissionTable } from "./components/MissionTable"

export default function MissionsPage() {
  return (
    <div className="space-y-6">
      {/* Header with NASA-style typography */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4">MISSIONS</h1>
        <p className="text-muted-foreground mt-2 font-technical tracking-wide">
          Manage and monitor all Mars missions • Mission Control Center
        </p>
      </div>

      <MissionTable />
    </div>
  )
}
