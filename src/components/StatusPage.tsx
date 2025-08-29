'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface HealthStatus {
  status: string
  timestamp: string
  environment: string
  app: string
  version: string
  domain: string
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        if (response.ok) {
          const data = await response.json()
          setHealth(data)
        } else {
          setError('Health check failed')
        }
      } catch (_err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    if (loading) return <Clock className="h-4 w-4 text-yellow-500" />
    if (error || health?.status !== 'healthy') return <AlertCircle className="h-4 w-4 text-red-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusColor = () => {
    if (loading) return 'bg-yellow-100 text-yellow-800'
    if (error || health?.status !== 'healthy') return 'bg-red-100 text-red-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Minimarket ARAMAC Status
          </CardTitle>
          <CardDescription>
            Deployment status for minimarket.aramac.dev
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={getStatusColor()}>
              {loading ? 'Checking...' : error ? 'Error' : health?.status || 'Unknown'}
            </Badge>
          </div>

          {health && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Environment:</span>
                <Badge variant="outline">{health.environment}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Version:</span>
                <Badge variant="outline">{health.version}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Domain:</span>
                <Badge variant="outline">{health.domain}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Check:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(health.timestamp).toLocaleString()}
                </span>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This page shows the deployment status of your minimarket application.
              The health check runs automatically every 30 seconds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 