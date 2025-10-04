"use client"

import { useState, useEffect } from 'react'

export function useRealTimeClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return time
}

export function useBackendHealth() {
  const [isOnline, setIsOnline] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        setIsOnline(response.ok)
      } catch (error) {
        setIsOnline(false)
      } finally {
        setIsChecking(false)
      }
    }

    // Check immediately
    checkHealth()

    // Then check every 30 seconds
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  return { isOnline, isChecking }
}