"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MdDashboard,
  MdRocket,
  MdRestaurantMenu,
  MdInventory,
  MdWork,
  MdCompareArrows,
  MdCalendarMonth,
} from "react-icons/md"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: MdDashboard },
  { name: "Missions", href: "/missions", icon: MdRocket },
  { name: "Recipes", href: "/recipes", icon: MdRestaurantMenu },
  { name: "Items", href: "/items", icon: MdInventory },
  { name: "Job Center", href: "/jobs", icon: MdWork },
  { name: "Diff Viewer", href: "/diff", icon: MdCompareArrows },
  { name: "Scheduler", href: "/scheduler", icon: MdCalendarMonth },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <MdRocket className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Mars</h2>
            <p className="text-xs text-muted-foreground">Mission Control</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-4 py-3 bg-secondary rounded-lg">
          <p className="text-xs text-muted-foreground">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-foreground">Operational</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
