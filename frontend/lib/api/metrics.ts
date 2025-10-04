import { apiRequest } from './client'

export interface MetricBlock {
  count: number
  delta?: number | null
  extra?: number | null
}

export interface MetricsSummary {
  active_missions: MetricBlock
  total_recipes: MetricBlock
  planned_items: MetricBlock
  pending_jobs: MetricBlock
}

// API functions for metrics
export const metricsApi = {
  // Get summary metrics for dashboard
  async getSummary(missionId?: string): Promise<MetricsSummary> {
    const params = missionId ? `?mission_id=${missionId}` : ''
    return apiRequest<MetricsSummary>(`/metrics/summary${params}`)
  },
}