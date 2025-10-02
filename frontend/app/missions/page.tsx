import { Button } from "@/components/ui/button"
import { MdAdd } from "react-icons/md"
import Link from "next/link"
import { MissionTable } from "./components/MissionTable"

export default function MissionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Missions</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all Mars missions</p>
        </div>
        <Link href="/missions/new">
          <Button className="gap-2">
            <MdAdd className="w-5 h-5" />
            New Mission
          </Button>
        </Link>
      </div>

      <MissionTable />
    </div>
  )
}
