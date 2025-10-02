import { MissionSummary } from "../components/MissionSummary"
import { MissionTabs } from "../components/MissionTabs"
import { mockMissions } from "@/types/mission"
import { notFound } from "next/navigation"

export default function MissionDetailsPage({ params }: { params: { id: string } }) {
  const mission = mockMissions.find((m) => m.id === params.id)

  if (!mission) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <MissionSummary mission={mission} />
      <MissionTabs mission={mission} />
    </div>
  )
}
