
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import SummaryCard from '../../components/SummaryCard'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000'

function DashboardPage() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch inquiries from backend
  useEffect(() => {
    async function fetchInquiries() {
      try {
        const token = localStorage.getItem('inquiryDeskToken')

        if (!token) {
          window.location.href = '/'
          return
        }

        const response = await fetch(
          `${API_URL}/api/inquiries`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const result = await response.json()

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('inquiryDeskToken')
            localStorage.removeItem('inquiryDeskUser')
            window.location.href = '/'
            return
          }

          throw new Error(
            result.message || 'Unable to load inquiries.'
          )
        }

        const data = Array.isArray(result)
          ? result
          : result.inquiries || []

        setInquiries(data)
      } catch (err) {
        setError(err.message || 'Unable to connect to the server.')
      } finally {
        setLoading(false)
      }
    }

    fetchInquiries()
  }, [])

  // Summary card counts
  const total = inquiries.length

  const normalizeStatus = (value) =>
    String(value || '').trim().toLowerCase().replace(/_/g, ' ')

  const pending = inquiries.filter(
    (item) => normalizeStatus(item.status) === 'new'
  ).length

  const inProgress = inquiries.filter(
    (item) => normalizeStatus(item.status) === 'in progress'
  ).length

  const resolved = inquiries.filter(
    (item) => item.status === 'Resolved'
  ).length

  // Get the 5 most recent inquiries
  const recentInquiries = [...inquiries]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()

      return dateB - dateA
    })
    .slice(0, 5)

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Inquiries',
      value: total,
      variant: 'blue',
    },
    {
      title: 'New',
      value: pending,
      variant: 'sky',
    },
    {
      title: 'In Progress',
      value: inProgress,
      variant: 'orange',
    },
    {
      title: 'Resolved',
      value: resolved,
      variant: 'green',
    },
  ]

  // Status badge styling
  function getStatusStyle(itemStatus) {
    switch (itemStatus) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200'

      case 'In Progress':
        return 'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200'

      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200'

      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  // Format inquiry date
  function formatDate(date) {
    if (!date) return 'â€”'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'â€”'
    }

    return parsedDate.toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <AdminLayout activePage="dashboard">
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* Dashboard Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            InquiryDesk
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and track customer inquiries.
          </p>
          </div>

        <div className="flex items-center gap-3">
          <a
            href="/all-inquiries"
            className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-50"
          >
            View All Inquiries
          </a>
          <button
            type="button"
            onClick={() => window.location.reload()}
            aria-label="Refresh dashboard"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 11a8 8 0 1 0 1 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 5v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.title}
            {...card}
            loading={loading}
          />
        ))}
      </div>

      {/* Recent Inquiries */}
      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Recent Inquiries Header */}
        <div className="border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Inquiries
            </h2>
          </div>
        </div>

        {/* Recent Inquiries Loading */}
        {loading && (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading recent inquiries...
          </div>
        )}

        {/* Recent Inquiries Error */}
        {!loading && error && (
          <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Unable to load recent inquiries.
          </div>
        )}

        {/* Recent Inquiries Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            {recentInquiries.length > 0 ? (
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Inquiry ID</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Customer</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Subject</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Created Date</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInquiries.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-3 text-xs text-slate-500">INQ-{item.id}</td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-slate-800">{item.customer_name || 'Unknown customer'}</p>
                        <p className="text-xs text-slate-500">{item.customer_email || 'No email available'}</p>
                      </td>
                      <td className="max-w-[180px] truncate px-5 py-3 text-sm text-slate-600">{item.subject || 'No subject'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(item.status)}`}>
                          {item.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDate(item.created_at)}</td>
                      <td className="px-5 py-3">
                        <a href={`/inquiries/${item.id}`} className="inline-flex rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <h3 className="text-sm font-semibold text-slate-700">No recent inquiries</h3>
                <p className="mt-1 text-sm text-slate-500">Customer inquiries will appear here.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end border-t border-slate-100 px-5 py-4">
          <a
            href="/all-inquiries"
            className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
          >
            View all inquiries <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      </div>
    </AdminLayout>
  )
}

export default DashboardPage
