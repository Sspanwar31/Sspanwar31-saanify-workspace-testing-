'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// Helper to render JSON/Objects safely (CRASH PREVENTION)
const safeRender = (val: any) => {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'object') {
    try { return JSON.stringify(val) } catch (e) { return 'Error' }
  }
  return String(val)
}

export default function AutomationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<{ tasks: any[], logs: any[] }>({ tasks: [], logs: [] })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/super-admin/automation/data')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setData({ tasks: json.tasks || [], logs: json.logs || [] })
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) return <div className="p-10">Loading...</div>

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Automation Dashboard</h1>
      
      {/* TASKS TABLE */}
      <div className="border rounded bg-white p-4">
        <h2 className="font-bold mb-4">Tasks</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-100"><th className="p-2">Name</th><th className="p-2">Status</th></tr>
            </thead>
            <tbody>
              {data.tasks.map((t: any, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{safeRender(t.task_name)}</td>
                  <td className="p-2">{t.enabled ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="border rounded bg-white p-4">
        <h2 className="font-bold mb-4">Logs</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-100"><th className="p-2">Task</th><th className="p-2">Details</th></tr>
            </thead>
            <tbody>
              {data.logs.map((l: any, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{safeRender(l.task_name)}</td>
                  <td className="p-2 font-mono text-xs">{safeRender(l.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
