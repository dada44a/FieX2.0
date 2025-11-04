import { createLazyFileRoute } from '@tanstack/react-router'
import  { useEffect, useState } from 'react'

interface SalesReport {
  date: string
  totalSales: number
  genreSales: { genre: string; total: number }[]
}

export const Route = createLazyFileRoute('/protected/admin/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<SalesReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = async () => {
    if (!fromDate || !toDate) return alert('Please select both dates.')
    setLoading(true)
    setError(null)
    try {
      // replace this with your actual API endpoint
      const res = await fetch(
        `http://localhost:8080/api/reports?from=${fromDate}&to=${toDate}`
      )
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data: SalesReport = await res.json()
      setReport(data)
    } catch (err) {
      setError('Failed to fetch sales report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Optionally auto-load recent report (e.g., last 7 days)
    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 7)
    setFromDate(lastWeek.toISOString().slice(0, 10))
    setToDate(today.toISOString().slice(0, 10))
  }, [])

  return (
    <main className="p-6 min-h-screen">
      <h1 className="text-2xl font-bold mb-6"> Sales Reports</h1>

      {/* Filter Section */}
      <div className="card bg-base-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">
              <span className="label-text font-semibold">From Date</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text font-semibold">To Date</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner" /> : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Report Data */}
      {report && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">Overall Summary</h2>
            <p className="text-lg">
              Total Sales from <b>{fromDate}</b> to <b>{toDate}</b>:
            </p>
            <p className="text-3xl font-bold text-primary mt-2">
              Rs. {report.totalSales.toLocaleString()}
            </p>
          </div>

          {/* Genre-wise Sales Table */}
          <div className="card bg-base-100 shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Genre-wise Sales</h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Genre</th>
                    <th>Total Sales (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.genreSales.length > 0 ? (
                    report.genreSales.map((genre) => (
                      <tr key={genre.genre}>
                        <td>{genre.genre}</td>
                        <td>{genre.total.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="text-center text-gray-500 py-4">
                        No data found for this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!report && !loading && (
        <p className="text-gray-500 text-center mt-10">
          Select a date range and click "Generate Report" to view sales data.
        </p>
      )}
    </main>
  )
}
