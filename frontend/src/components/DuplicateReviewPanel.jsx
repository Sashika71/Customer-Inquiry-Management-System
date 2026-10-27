
import { useEffect, useState } from 'react'
import API_URL from '../config/api'

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

function DuplicateReviewPanel({
  inquiry,
  onClose,
  onConfirmed,
}) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadMatches() {
      setLoading(true)
      setError('')
      setMatches([])
      setMessage('')
      setActionError('')

      try {
        const token = localStorage.getItem('inquiryDeskToken')

        const response = await fetch(
          `${API_URL}/api/inquiries/${inquiry.id}/possible-duplicates`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.message || 'Unable to check possible duplicates.'
          )
        }

        if (!cancelled) {
          setMatches(
            Array.isArray(result.possibleDuplicates)
              ? result.possibleDuplicates
              : []
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Unable to connect to the server.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadMatches()

    return () => {
      cancelled = true
    }
  }, [inquiry.id])

  async function confirmDuplicate(originalInquiry) {
    if (savingId !== null || inquiry.is_duplicate) return

    const confirmed = window.confirm(
      `Mark INQ-${inquiry.id} as a duplicate of INQ-${originalInquiry.id}?`
    )

    if (!confirmed) return

    setSavingId(originalInquiry.id)
    setActionError('')
    setMessage('')

    try {
      const token = localStorage.getItem('inquiryDeskToken')

      const response = await fetch(
        `${API_URL}/api/inquiries/${inquiry.id}/duplicate`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            duplicate_of_id: originalInquiry.id,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Unable to mark inquiry as duplicate.'
        )
      }

      setMessage(
        result.message || 'Duplicate confirmed successfully.'
      )

      // Update the parent page's inquiry list.
      if (result.inquiry) {
        onConfirmed?.({
          ...inquiry,
          ...result.inquiry,
          is_duplicate: true,
          duplicate_of_id: originalInquiry.id,
        })
      }
    } catch (err) {
      setActionError(
        err.message || 'Unable to connect to the server.'
      )
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          savingId === null
        ) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-panel-title"
        className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2
              id="duplicate-panel-title"
              className="text-xl font-bold text-slate-900"
            >
              Duplicate Inquiry Review
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Compare the details before confirming a duplicate.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={savingId !== null}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close duplicate review"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <p className="mb-2 text-xs font-semibold text-blue-700">
              CURRENT INQUIRY · INQ-{inquiry.id}
            </p>
            <h3 className="font-semibold text-slate-900">
              {inquiry.subject || 'No subject'}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {inquiry.customer_name} · {inquiry.customer_email}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
              {inquiry.message || 'No message available.'}
            </p>
          </div>

          {loading && (
            <p className="py-6 text-center text-sm text-slate-500">
              Checking possible duplicates...
            </p>
          )}

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
              <button
                type="button"
                onClick={() => {
                  // Reload the page to retry the request.
                  window.location.reload()
                }}
                className="ml-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">
                Possible Original Inquiries
              </h3>

              {matches.length === 0 ? (
                <div className="rounded-xl border border-slate-200 p-6 text-center">
                  <p className="font-semibold text-slate-800">
                    No possible duplicates found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    No matching inquiries were returned by the backend.
                  </p>
                </div>
              ) : (
                matches.map((match) => (
                  <article
                    key={match.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="text-xs font-semibold text-amber-700">
                      POSSIBLE MATCH · INQ-{match.id}
                    </p>

                    <h4 className="mt-1 font-semibold text-slate-900">
                      {match.subject || 'No subject'}
                    </h4>

                    <p className="mt-1 text-sm text-slate-600">
                      {match.customer_name} · {match.customer_email}
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                      {match.message || 'No message available.'}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Subject similarity
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {Math.round(
                            Number(match.subject_similarity || 0) * 100
                          )}%
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Message similarity
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {Math.round(
                            Number(match.message_similarity || 0) * 100
                          )}%
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Status: {match.status || 'Unknown'} · Created:{' '}
                      {formatDate(match.created_at)}
                    </p>

                    <button
                      type="button"
                      disabled={
                        savingId !== null || inquiry.is_duplicate
                      }
                      onClick={() => confirmDuplicate(match)}
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === match.id
                        ? 'Saving...'
                        : 'Confirm & Mark as Duplicate'}
                    </button>
                  </article>
                ))
              )}
            </div>
          )}

          {message && (
            <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {message}
            </div>
          )}

          {actionError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {actionError}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={savingId !== null}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  )
}

export default DuplicateReviewPanel
