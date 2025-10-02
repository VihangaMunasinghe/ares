import { MissionForm } from "../components/MissionForm"

export default function NewMissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create New Mission</h1>
        <p className="text-muted-foreground mt-1">Configure and launch a new Mars mission</p>
      </div>

      <MissionForm />
    </div>
  )
}
