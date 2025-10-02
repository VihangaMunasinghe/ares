"use client"

import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MdArrowForward } from "react-icons/md"
import type { Mission } from "@/types/mission"

interface MissionTabsProps {
  mission: Mission
}

export function MissionTabs({ mission }: MissionTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="recipes">Recipes</TabsTrigger>
        <TabsTrigger value="jobs">Jobs</TabsTrigger>
        <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mission Overview</CardTitle>
            <CardDescription>Key information and statistics for {mission.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Mission Objectives</h3>
                <p className="text-sm text-muted-foreground">{mission.description || "No description provided"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Mission Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-blue-500 rounded" />
                    <span className="text-sm">Transit: {mission.transit_weeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-48 h-2 bg-green-500 rounded" />
                    <span className="text-sm">Surface: {mission.surface_weeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-orange-500 rounded" />
                    <span className="text-sm">Return: {mission.return_weeks} weeks</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="items" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mission Items</CardTitle>
            <CardDescription>Manage items and inventory for this mission</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">View and manage items for this mission</p>
            <Link href={`/items?mission=${mission.id}`}>
              <Button className="gap-2">
                Go to Items
                <MdArrowForward className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recipes" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mission Recipes</CardTitle>
            <CardDescription>View recycling recipes for this mission</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">View and manage recipes for this mission</p>
            <Link href={`/recipes?mission=${mission.id}`}>
              <Button className="gap-2">
                Go to Recipes
                <MdArrowForward className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="jobs" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mission Jobs</CardTitle>
            <CardDescription>View production jobs for this mission</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">View and manage jobs for this mission</p>
            <Link href={`/jobs?mission=${mission.id}`}>
              <Button className="gap-2">
                Go to Jobs
                <MdArrowForward className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="scheduler" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mission Scheduler</CardTitle>
            <CardDescription>View optimized schedule for this mission</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">View the optimized schedule for this mission</p>
            <Link href={`/scheduler?mission=${mission.id}`}>
              <Button className="gap-2">
                Go to Scheduler
                <MdArrowForward className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
