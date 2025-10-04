import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MdTrendingUp, MdTrendingDown, MdAdd, MdRemove, MdInfo, MdSearch, MdFilterList } from "react-icons/md"
import type { MaterialQuantityDiff, OptimizationDiff } from "@/types/jobs"

interface DiffViewerProps {
  diff: OptimizationDiff
}

export default function DiffViewer({ diff }: DiffViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [changeTypeFilter, setChangeTypeFilter] = useState("all")
  const [impactFilter, setImpactFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) // Show fewer items per page for material changes
  const [isLoading, setIsLoading] = useState(false)
  
  // Filter material changes
  const filteredChanges = useMemo(() => {
    return diff.materialChanges.filter(change => {
      const matchesSearch = change.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          change.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "all" || change.category === categoryFilter
      const matchesChangeType = changeTypeFilter === "all" || change.changeType === changeTypeFilter
      const matchesImpact = impactFilter === "all" || change.impactType === impactFilter
      
      return matchesSearch && matchesCategory && matchesChangeType && matchesImpact
    })
  }, [diff.materialChanges, searchQuery, categoryFilter, changeTypeFilter, impactFilter])
  
  // Paginate material changes
  const paginatedChanges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredChanges.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredChanges, currentPage, itemsPerPage])
  
  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage)
  
  // Get unique categories, change types, and impact types for filters
  const categories = useMemo(() => 
    [...new Set(diff.materialChanges.map(c => c.category))], [diff.materialChanges])
  const changeTypes = useMemo(() => 
    [...new Set(diff.materialChanges.map(c => c.changeType))], [diff.materialChanges])
  const impactTypes = useMemo(() => 
    [...new Set(diff.materialChanges.map(c => c.impactType))], [diff.materialChanges])
  
  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, changeTypeFilter, impactFilter])
  
  // Debounced search effect for performance
  React.useEffect(() => {
    if (diff.materialChanges.length > 100) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [searchQuery, diff.materialChanges.length])
  const getChangeIcon = (changeType: MaterialQuantityDiff['changeType']) => {
    switch (changeType) {
      case 'reduced':
      case 'eliminated':
        return <MdTrendingDown className="w-4 h-4 text-green-600" />
      case 'increased':
        return <MdTrendingUp className="w-4 h-4 text-blue-600" />
      case 'added':
        return <MdAdd className="w-4 h-4 text-purple-600" />
      default:
        return <MdInfo className="w-4 h-4 text-gray-500" />
    }
  }

  const getChangeBadgeVariant = (changeType: MaterialQuantityDiff['changeType']) => {
    switch (changeType) {
      case 'reduced':
      case 'eliminated':
        return 'default' // Green
      case 'increased':
        return 'secondary' // Blue
      case 'added':
        return 'outline' // Purple outline
      default:
        return 'outline'
    }
  }

  const getImpactColor = (impactType: MaterialQuantityDiff['impactType']) => {
    switch (impactType) {
      case 'mass_saving':
        return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900/20'
      case 'recycling_gain':
        return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/20'
      case 'safety_improvement':
        return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/20'
      case 'efficiency_gain':
        return 'text-purple-700 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/20'
      default:
        return 'text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-900/20'
    }
  }

  const formatNumber = (num: number, unit: string) => {
    if (num === 0) return `0 ${unit}`
    return `${num > 0 ? '+' : ''}${num.toLocaleString()} ${unit}`
  }

  const formatPercentage = (before: number, change: number) => {
    if (before === 0) return change > 0 ? '+∞%' : '0%'
    const percentage = (change / before) * 100
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {diff.summary.totalMassSaved.toLocaleString()}kg
            </div>
            <div className="text-sm text-muted-foreground">Mass Saved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {diff.summary.totalItemsAffected.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Items Affected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {diff.summary.recyclingTasksAdded}
            </div>
            <div className="text-sm text-muted-foreground">Recycling Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {diff.summary.safetyImprovements}
            </div>
            <div className="text-sm text-muted-foreground">Safety Gains</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Notice for Large Datasets */}
      {diff.materialChanges.length > 100 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <MdInfo className="w-4 h-4" />
              <span className="text-sm font-medium">
                Large Dataset Detected: {diff.materialChanges.length.toLocaleString()} material changes found. 
                Use filters and search to navigate efficiently.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Material Quantity Changes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {filteredChanges.length} of {diff.materialChanges.length} material changes
          </p>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search materials by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <MdFilterList className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Changes</SelectItem>
                  {changeTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impacts</SelectItem>
                  {impactTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-muted rounded" />
                      <div>
                        <div className="w-32 h-4 bg-muted rounded mb-2" />
                        <div className="w-24 h-3 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-6 bg-muted rounded" />
                      <div className="w-20 h-6 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="w-full h-16 bg-muted rounded" />
                    <div className="w-full h-16 bg-muted rounded" />
                    <div className="w-full h-16 bg-muted rounded" />
                  </div>
                  <div className="w-full h-12 bg-muted rounded" />
                </div>
              ))
            ) : filteredChanges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No material changes match your current filters
              </div>
            ) : (
              paginatedChanges.map((change, index) => (
              <div key={change.itemId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getChangeIcon(change.changeType)}
                    <div>
                      <div className="font-medium">{change.itemName}</div>
                      <div className="text-sm text-muted-foreground">{change.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getChangeBadgeVariant(change.changeType)}>
                      {change.changeType}
                    </Badge>
                    <Badge variant="outline" className={getImpactColor(change.impactType)}>
                      {change.impactType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Before/After Quantities */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Before</div>
                    <div className="text-lg font-semibold">
                      {change.before.toLocaleString()} {change.unit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">After</div>
                    <div className="text-lg font-semibold">
                      {change.after.toLocaleString()} {change.unit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Change</div>
                    <div className={`text-lg font-semibold ${
                      change.change < 0 ? 'text-green-600' : 
                      change.change > 0 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {formatNumber(change.change, change.unit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(change.before, change.change)}
                    </div>
                  </div>
                </div>

                {/* Justification */}
                <div className="bg-muted/50 rounded p-3">
                  <div className="text-sm font-medium mb-1">Justification</div>
                  <div className="text-sm text-muted-foreground">{change.justification}</div>
                  {change.weekApplied && change.weekApplied.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Applied in weeks: {change.weekApplied.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
          
          {/* Material Changes Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredChanges.length)} of {filteredChanges.length} materials
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const pageNumber = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i
                    if (pageNumber > totalPages) return null
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Strategy & Justification */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">Primary Strategy</div>
              <div className="text-muted-foreground bg-muted/50 rounded p-3">
                {diff.justification.primaryStrategy}
              </div>
            </div>

            <Separator />

            <div>
              <div className="font-medium mb-2">Key Decisions</div>
              <div className="space-y-2">
                {diff.justification.keyDecisions.map((decision, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-muted-foreground">{decision}</div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="font-medium mb-2">Trade-offs Considered</div>
              <div className="space-y-2">
                {diff.justification.tradeOffs.map((tradeOff, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-muted-foreground">{tradeOff}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}