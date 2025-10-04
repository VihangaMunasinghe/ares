"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { MissionSummary } from "../components/MissionSummary"
import { MissionItemsManager } from "../components/MissionItemsManager"
import { missionsApi, type Mission } from "@/lib/api/missions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MdArrowBack, MdRefresh } from "react-icons/md"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function MissionDetailsPage() {
  const params = useParams()
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const missionId = params.id as string

  const fetchMission = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await missionsApi.getMission(missionId)
      setMission(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mission'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (missionId) {
      fetchMission()
    }
  }, [missionId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/missions">
            <Button variant="outline" size="sm" className="gap-2">
              <MdArrowBack className="w-4 h-4" />
              Back to Missions
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin text-4xl">🔄</div>
              <h3 className="text-xl font-semibold text-foreground">Loading mission...</h3>
              <p className="text-muted-foreground">Please wait while we fetch the mission details</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !mission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/missions">
            <Button variant="outline" size="sm" className="gap-2">
              <MdArrowBack className="w-4 h-4" />
              Back to Missions
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="text-6xl">⚠️</div>
              <h3 className="text-xl font-semibold text-foreground">Mission not found</h3>
              <p className="text-muted-foreground max-w-sm">
                {error || "The mission you're looking for doesn't exist or has been removed."}
              </p>
              <div className="flex gap-2">
                <Button onClick={fetchMission} variant="outline" className="gap-2">
                  <MdRefresh className="w-4 h-4" />
                  Try again
                </Button>
                <Link href="/missions">
                  <Button>Return to Missions</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/missions">
          <Button variant="outline" size="sm" className="gap-2">
            <MdArrowBack className="w-4 h-4" />
            Back to Missions
          </Button>
        </Link>
      </div>
      <MissionSummary mission={mission} />
      <MissionItemsManager mission={mission} />
    </div>
  )
}
