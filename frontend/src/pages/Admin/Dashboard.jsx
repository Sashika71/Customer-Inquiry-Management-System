
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import SummaryCard from '../../components/SummaryCard'
import DuplicateReviewPanel from '../../components/DuplicateReviewPanel'
import API_URL from '../../config/api'

function DashboardPage() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState(null)

  async function fetchInquiries() {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('inquiryDeskToken')

      if (!token) {
        window.location.href = '/'
        return
      }

      const response = await fetch(`${API_URL}/api/inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const result = await response.json()

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('inquiryDeskToken')
        localStorage.removeItem('inquiryDeskUser')
        window.location.href = '/'
        return
      }

      if (!response.ok) {
        throw new Error(result.message || 'Unable to load inquiries.')
      }

      setInquiries(
        Array.isArray(result) ? result : result.inquiries || []
      )
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [])

  const normalizeStatus = (value) =>
    String(value || '').trim().toLowerCase().replace(/_/g, ' ')

  const total = inquiries.length
  const pending = inquiries.filter(
    (item) => ['new', 'pending'].includes(normalizeStatus(item.status))
  ).length
  const inProgress = inquiries.filter(
    (item) => normalizeStatus(item.status) === 'in progress'
  ).length
  const resolved = inquiries.filter(
    (item) => normalizeStatus(item.status) === 'resolved'
  ).length
  const confirmedDuplicates = inquiries.filter(
    (item) =>
      item.is_duplicate === true || item.is_duplicate === 1
  ).length

  const summaryCards = [
    { title: 'Total Inquiries', value: total, variant: 'blue' },
    { title: 'New', value: pending, variant: 'sky' },
    { title: 'In Progress', value: inProgress, variant: 'orange' },
    { title: 'Resolved', value: resolved, variant: 'green' },
    {
      title: 'Confirmed Duplicates',
      value: confirmedDuplicates,
      variant: 'orange',
    },
  ]

  const recentInquiries = [...inquiries]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )
    .slice(0, 5)

  function formatDate(value) {
    if (!value) return '—'
    const date = new Date(value)

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString([], {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
  }

  function getStatusStyle(status) {
    switch (normalizeStatus(status)) {
      case 'new':
        return 'bg-slate-100 text-slate-700'
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'in progress':
        return 'bg-orange-100 text-orange-800'
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  function handleDuplicateConfirmed(updatedInquiry) {
    setInquiries((current) =>
      current.map((item) =>
        Number(item.id) === Number(updatedInquiry.id)
          ? { ...item, ...updatedInquiry, is_duplicate: true }
          : item
      )
    )

    setSelectedInquiry(updatedInquiry)
  }

  return (
    <AdminLayout activePage="dashboard">
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
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

          <div className="flex gap-3">
            <a
              href="/all-inquiries"
              className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              View All Inquiries
            </a>

            <button
              type="button"
              onClick={fetchInquiries}
              disabled={loading}
              aria-label="Refresh dashboard"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.title}
              {...card}
              loading={loading}
            />
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={fetchInquiries}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Inquiries
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review customer requests and check for duplicates.
            </p>
          </div>

          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Loading inquiries...
            </p>
          ) : !error && recentInquiries.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No recent inquiries.
            </p>
          ) : !error ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      'Inquiry ID',
                      'Customer',
                      'Subject',
                      'Status',
                      'Created Date',
                      'Duplicate Review',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-semibold text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentInquiries.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-xs text-slate-500">
                        INQ-{item.id}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.customer_name || 'Unknown customer'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.customer_email || 'No email available'}
                        </p>
                      </td>

                      <td className="max-w-[180px] truncate px-5 py-4 text-sm text-slate-600">
                        {item.subject || 'No subject'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(item.status)}`}
                        >
                          {item.status || 'Unknown'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        {item.is_duplicate === true ||
                        item.is_duplicate === 1 ? (
                          <span className="whitespace-nowrap rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                            Duplicate
                            {item.duplicate_of_id
                              ? ` of INQ-${item.duplicate_of_id}`
                              : ''}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedInquiry(item)}
                            className="whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                          >
                            Review Duplicates
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <a
                          href={`/inquiries/${item.id}`}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="flex justify-end border-t border-slate-100 px-5 py-4">
            <a
              href="/all-inquiries"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View all inquiries →
            </a>
          </div>
        </section>

        {selectedInquiry && (
          <DuplicateReviewPanel
            inquiry={selectedInquiry}
            onClose={() => setSelectedInquiry(null)}
            onConfirmed={handleDuplicateConfirmed}
          />
        )}
      </main>
    </AdminLayout>
  )
}

export default DashboardPage
