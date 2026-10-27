
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import DuplicateReviewPanel from '../../components/DuplicateReviewPanel'
import API_URL from '../../config/api'

const PAGE_SIZE = 5

function statusStyle(status) {
  const normalized = String(status || '').toLowerCase().trim()

  if (normalized === 'new') {
    return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
  }
  if (normalized === 'pending') {
    return 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200'
  }
  if (normalized === 'in progress') {
    return 'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200'
  }
  if (normalized === 'resolved') {
    return 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200'
  }

  return 'bg-slate-100 text-slate-600'
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
}

function AllInquiries() {
  const [inquiries, setInquiries] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function loadInquiries() {
      const token = localStorage.getItem('inquiryDeskToken')

      if (!token) {
        window.location.href = '/'
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/inquiries`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('inquiryDeskToken')
          localStorage.removeItem('inquiryDeskUser')
          window.location.href = '/'
          return
        }

        if (!response.ok) {
          throw new Error(
            result.message || 'Unable to load inquiries.'
          )
        }

        setInquiries(
          Array.isArray(result) ? result : result.inquiries || []
        )
      } catch (loadError) {
        setError(
          loadError.message || 'Unable to connect to the server.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadInquiries()
  }, [refreshKey])

  const filteredInquiries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return inquiries.filter((item) => {
      const matchesQuery = [
        item.id,
        item.customer_name,
        item.customer_email,
        item.subject,
      ].some((value) =>
        String(value || '').toLowerCase().includes(normalizedQuery)
      )

      const matchesStatus =
        status === 'All' ||
        String(item.status || '').toLowerCase() ===
          status.toLowerCase()

      const matchesDate =
        !date ||
        (item.created_at &&
          String(item.created_at).slice(0, 10) === date)

      return matchesQuery && matchesStatus && matchesDate
    })
  }, [date, inquiries, query, status])

  const pageCount = Math.max(
    1,
    Math.ceil(filteredInquiries.length / PAGE_SIZE)
  )

  const pageInquiries = filteredInquiries.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  function updateFilter(setter, value) {
    setter(value)
    setPage(1)
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
    <AdminLayout activePage="inquiries">
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                All Inquiries
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage and review all customer inquiries.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              disabled={loading}
              aria-label="Refresh inquiries"
              title="Refresh inquiries"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600 shadow-sm hover:bg-slate-100 disabled:cursor-wait disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 11a8 8 0 0 0-14.9-4M4 5v4h4M4 13a8 8 0 0 0 14.9 4M20 19v-4h-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
              <div className="relative min-w-[220px] flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="m16 16 4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  value={query}
                  onChange={(event) =>
                    updateFilter(setQuery, event.target.value)
                  }
                  placeholder="Search by customer, email, subject or inquiry ID..."
                  className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  updateFilter(setStatus, event.target.value)
                }
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-400"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <input
                aria-label="Filter by date"
                type="date"
                value={date}
                onChange={(event) =>
                  updateFilter(setDate, event.target.value)
                }
                className="h-9 rounded-md border border-slate-200 px-3 text-xs text-slate-600 outline-none focus:border-blue-400"
              />

              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setStatus('All')
                  setDate('')
                  setPage(1)
                }}
                className="h-9 px-2 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-xs text-slate-500">
                Total{' '}
                <strong className="text-slate-700">
                  {filteredInquiries.length}
                </strong>{' '}
                inquiries
              </p>
            </div>

            {loading && (
              <div className="p-12 text-center text-sm text-slate-500">
                Loading inquiries...
              </div>
            )}

            {!loading && error && (
              <div
                role="alert"
                className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {!loading && !error && (
              filteredInquiries.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  No inquiries match the selected filters.
                </div>
              ) : (
                <div className="w-full">
                  <table className="w-full table-fixed text-left text-xs">
                    <colgroup>
                      <col className="w-[8%]" />
                      <col className="w-[18%]" />
                      <col className="w-[19%]" />
                      <col className="w-[11%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[14%]" />
                      <col className="w-[7%]" />
                    </colgroup>
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          'Inquiry ID',
                          'Customer',
                          'Subject',
                          'Status',
                          'Created Date',
                          'Last Updated',
                          'Duplicate Review',
                          'Action',
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap px-3 py-3 font-semibold text-slate-500 sm:px-4"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {pageInquiries.map((item) => (
                        <tr
                          key={item.id}
                          className="align-middle hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-3 py-4 text-slate-500 sm:px-4">
                            INQ-{item.id}
                          </td>

                          <td className="px-3 py-4 sm:px-4">
                            <p className="font-semibold text-slate-800">
                              {item.customer_name || 'Unknown customer'}
                            </p>
                            <p className="break-all text-[11px] leading-4 text-slate-500">
                              {item.customer_email || 'No email available'}
                            </p>
                          </td>

                          <td className="break-words px-3 py-4 leading-4 text-slate-600 sm:px-4">
                            {item.subject || 'No subject'}
                          </td>

                          <td className="px-3 py-4 sm:px-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyle(item.status)}`}
                            >
                              {item.status || 'Unknown'}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-slate-500 sm:px-4">
                            {formatDate(item.created_at)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-slate-500 sm:px-4">
                            {formatDate(
                              item.updated_at || item.created_at
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 sm:px-4">
                            {item.is_duplicate === true ||
                            item.is_duplicate === 1 ? (
                              <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                                Duplicate
                                {item.duplicate_of_id
                                  ? ` of INQ-${item.duplicate_of_id}`
                                  : ''}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedInquiry(item)
                                }
                                className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                              >
                                Review Duplicates
                              </button>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 pr-5 sm:px-4 sm:pr-6">
                            <a
                              href={`/inquiries/${item.id}`}
                              className="inline-block rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {!loading && !error && filteredInquiries.length > 0 && (
              <div className="flex items-center justify-end gap-1 border-t border-slate-100 px-5 py-4">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-slate-500 disabled:opacity-40"
                >
                  ‹
                </button>

                {Array.from(
                  { length: pageCount },
                  (_, index) => index + 1
                ).map((number) => (
                  <button
                    type="button"
                    key={number}
                    onClick={() => setPage(number)}
                    className={`h-7 min-w-7 rounded px-2 text-xs ${
                      page === number
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={page === pageCount}
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                  className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-slate-500 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            )}
          </section>
        </div>

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

export default AllInquiries
