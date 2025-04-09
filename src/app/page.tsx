// pages/index.tsx
'use client'

import { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl shadow-md bg-white dark:bg-gray-800 ${className}`}>
    <div className="p-4">{children}</div>
  </div>
)

const Navbar = ({ toggleTheme }) => (
  <nav className="flex justify-between items-center p-4 bg-blue-900 text-white shadow">
    <h1 className="text-lg font-bold">Executive Summary Dashboard</h1>
    <button
      onClick={toggleTheme}
      className="text-sm bg-white text-blue-900 px-3 py-1 rounded shadow hover:bg-blue-100"
    >
      Toggle Theme
    </button>
  </nav>
)

export default function Home() {
  const [data, setData] = useState(null)
  const [lastUpdated, setLastUpdated] = useState("")
  const [weekFilter, setWeekFilter] = useState(null)
  const [systemFilter, setSystemFilter] = useState(null)
  const [error, setError] = useState("")
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('executiveDashboardData')
    if (saved) {
      try {
        setData(JSON.parse(saved))
        setLastUpdated(new Date().toLocaleDateString())
        return
      } catch {
        console.warn('⚠️ Failed to parse saved dashboard data.')
      }
    }

    fetch('/data/data.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => {
        setData(json)
        setLastUpdated(new Date().toLocaleDateString())
        const start = new Date("2025-01-20")
        const now = new Date()
        const weekNumber = Math.floor((now.getTime() - start.getTime()) / (7 * 86400000)) + 1
        const label = `Week ${weekNumber}`
        const match = json.weeklyCost.find(w => w.week === label)
        if (match) setWeekFilter(label)
      })
      .catch(err => setError("⚠️ Could not load data.json."))
  }, [])

  const saveData = () => {
    if (data) {
      localStorage.setItem('executiveDashboardData', JSON.stringify(data))
      alert('📦 Dashboard data saved!')
    }
  }

  const exportToPDF = () => {
    html2canvas(document.body, { scale: 2 }).then(canvas => {
      const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height])
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0)
      pdf.save('executive-summary.pdf')
    })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result as string)
        setData(parsed)
        setLastUpdated(new Date().toLocaleDateString())
      } catch {
        setError("Invalid JSON format")
      }
    }
    reader.readAsText(file)
  }

  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!data) return <div className="p-6 text-gray-600">Loading dashboard...</div>

  const filteredWeeklyCost = weekFilter ? data.weeklyCost.filter(w => w.week === weekFilter) : data.weeklyCost
  const filteredIssues = systemFilter ? data.issues.filter(i => i.system === systemFilter) : data.issues
  const weeks = [...new Set(data.weeklyCost.map(w => w.week))]
  const systems = [...new Set(data.issues.map(i => i.system))]

  return (
    <div className={dark ? "dark bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}>
      <Navbar toggleTheme={() => setDark(!dark)} />
      <div className="p-6 space-y-10">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">Executive Summary</div>
          <div className="flex gap-2">
            <input type="file" onChange={handleFileUpload} />
            <button onClick={saveData} className="bg-gray-300 px-3 py-1 rounded">Autosave</button>
            <button onClick={exportToPDF} className="bg-blue-600 text-white px-3 py-1 rounded">Export PDF</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Budget", value: `$${data.kpis.totalBudget.toLocaleString()}` },
            { label: "Spent", value: `$${data.kpis.spent.toLocaleString()}` },
            { label: "Remaining", value: `$${data.kpis.remaining.toLocaleString()}` },
            { label: "Risk", value: data.kpis.risk }
          ].map((kpi, i) => (
            <Card key={i}>
              <div className="text-sm text-gray-500">{kpi.label}</div>
              <div className="text-3xl font-bold">{kpi.value}</div>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {weeks.map((w, i) => (
            <button key={i} onClick={() => setWeekFilter(weekFilter === w ? null : w)} className={`px-3 py-1 border rounded ${weekFilter === w ? 'bg-blue-600 text-white' : 'text-blue-700 border-blue-600'}`}>{w}</button>
          ))}
          {systems.map((s, i) => (
            <button key={i} onClick={() => setSystemFilter(systemFilter === s ? null : s)} className={`px-3 py-1 border rounded ${systemFilter === s ? 'bg-green-600 text-white' : 'text-green-700 border-green-600'}`}>{s}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="mb-2 text-blue-800">Cost Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={filteredWeeklyCost}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="AdjustedTotalCost" stroke="#2563eb" />
                <Line type="monotone" dataKey="TotalWeeklyCost" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="mb-2 text-blue-800">Budget Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cost" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <h3 className="mb-2 text-blue-800">Schedule Tracker</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.schedule}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="task" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Planned" fill="#60a5fa" />
              <Bar dataKey="Actual" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="overflow-auto">
          <h3 className="mb-2 text-blue-800">Root Cause Matrix</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-800">
                <th className="p-2">Date</th>
                <th className="p-2">Issue</th>
                <th className="p-2">System</th>
                <th className="p-2">Impact</th>
                <th className="p-2">Accountability</th>
                <th className="p-2">Consequence</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((i, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="p-2">{i.date}</td>
                  <td className="p-2">{i.issue}</td>
                  <td className="p-2">{i.system}</td>
                  <td className="p-2">{i.impact}</td>
                  <td className="p-2">{i.accountability}</td>
                  <td className="p-2">{i.consequence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <footer className="pt-10 text-sm text-gray-500">
          Project Higuera Oversight | ADI • Last Updated: {lastUpdated}
        </footer>
      </div>
    </div>
  )
}
