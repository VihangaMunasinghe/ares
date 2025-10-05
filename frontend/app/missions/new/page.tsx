import { MissionForm } from "../components/MissionForm"

export default function NewMissionPage() {
  return (
    <div className="space-y-6">
      {/* Header with NASA-style typography */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight pt-4">CREATE NEW MISSION</h1>
        <p className="text-muted-foreground mt-2 font-technical tracking-wide">
          Configure and launch a new Mars mission • Mission Planning Center
        </p>
      </div>

      <MissionForm />
    </div>
  )
}
