
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import API_URL from '../../config/api'

const STATUSES = ['New', 'In Progress', 'Resolved']

function getToken() {
  return localStorage.getItem('inquiryDeskToken')
}

function normalizeStatus(status) {
  return status === 'Pending' ? 'New' : status
}

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return date.toLocaleString()
}

function statusStyle(status) {
  switch (normalizeStatus(status)) {
    case 'New':
      return 'bg-blue-100 text-blue-700'
    case 'In Progress':
      return 'bg-amber-100 text-amber-700'
    case 'Resolved':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.')
  }

  return data
}

export default function InquiryDetails() {
  const pathParts = window.location.pathname.split('/')
  const inquiryId = pathParts[pathParts.length - 1]

  const [inquiry, setInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [nextStatus, setNextStatus] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  const [emailMode, setEmailMode] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  const [statusUpdatedForResolution, setStatusUpdatedForResolution] =
    useState(false)

  const currentStatus = normalizeStatus(inquiry?.status)
  const isResolved = currentStatus === 'Resolved'

  // Load the selected inquiry from the backend.
  async function loadInquiry(showLoading = true) {
    if (!/^[1-9]\d*$/.test(String(inquiryId))) {
      setError('Invalid inquiry ID. Please select a valid inquiry.')
      setLoading(false)
      return
    }

    const token = getToken()

    if (!token) {
      window.location.href = '/'
      return
    }

    if (showLoading) {
      setLoading(true)
    }

    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/inquiries/${inquiryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('inquiryDeskToken')
        localStorage.removeItem('inquiryDeskUser')
        window.location.href = '/'
        return
      }

      const data = await readResponse(response)

      if (!data.inquiry) {
        throw new Error('Inquiry details could not be loaded.')
      }

      setInquiry(data.inquiry)
      setNextStatus(normalizeStatus(data.inquiry.status))
    } catch (err) {
      setError(err.message || 'Failed to load inquiry details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInquiry()
    // Load details when the selected inquiry ID changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId])

  // Update the status using the normal status-update action.
  async function updateStatus() {
    if (!inquiry || !nextStatus || nextStatus === 'Resolved') {
      return
    }

    if (nextStatus === currentStatus) {
      setSuccessMessage('The inquiry already has this status.')
      return
    }

    setSavingStatus(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/inquiries/${inquiryId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      )

      const data = await readResponse(response)
      const updatedInquiry = data.inquiry

      if (updatedInquiry) {
        setInquiry(updatedInquiry)
        setNextStatus(normalizeStatus(updatedInquiry.status))
      } else {
        await loadInquiry(false)
      }

      setSuccessMessage('Inquiry status updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update inquiry status.')
    } finally {
      setSavingStatus(false)
    }
  }

  // Open the follow-up email composer.
  function openEmailComposer() {
    setEmailMode('follow-up')
    setEmailSubject(
      inquiry?.subject ? `Follow-up: ${inquiry.subject}` : '',
    )
    setEmailMessage('')
    setEmailError('')
    setEmailSuccess('')
    setSuccessMessage('')
  }

  // Open the resolution email composer.
  function openResolutionComposer() {
    setEmailMode('resolution')
    setEmailSubject(
      inquiry?.subject ? `Resolution: ${inquiry.subject}` : '',
    )
    setEmailMessage('')
    setEmailError('')
    setEmailSuccess('')
    setSuccessMessage('')
    setStatusUpdatedForResolution(false)
  }

  function closeEmailComposer() {
    if (sendingEmail) return

    setEmailMode('')
    setEmailSubject('')
    setEmailMessage('')
    setEmailError('')
    setEmailSuccess('')
    setStatusUpdatedForResolution(false)
  }

  // Send a follow-up email or resolve the inquiry and notify the customer.
  async function sendEmail(event) {
    event.preventDefault()

    if (!emailMessage.trim()) {
      setEmailError(
        emailMode === 'resolution'
          ? 'Please enter the resolution message.'
          : 'Please enter the email message.',
      )
      return
    }

    if (emailMode === 'follow-up' && !emailSubject.trim()) {
      setEmailError('Please enter an email subject.')
      return
    }

    if (!inquiry) {
      setEmailError('Inquiry details are not available.')
      return
    }

    setSendingEmail(true)
    setEmailError('')
    setEmailSuccess('')
    setSuccessMessage('')

    let resolutionStatusSaved =
      emailMode === 'resolution' && isResolved

    try {
      // Step 1: Mark the inquiry as Resolved before sending
      // the resolution email. Do not repeat this on an email retry.
      if (emailMode === 'resolution' && !resolutionStatusSaved) {
        const statusResponse = await fetch(
          `${API_URL}/api/inquiries/${inquiryId}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ status: 'Resolved' }),
          },
        )

        const statusData = await readResponse(statusResponse)

        if (
          statusData.inquiry &&
          normalizeStatus(statusData.inquiry.status) !== 'Resolved'
        ) {
          throw new Error(
            'The inquiry status was not updated to Resolved.',
          )
        }

        resolutionStatusSaved = true
        setStatusUpdatedForResolution(true)

        if (statusData.inquiry) {
          setInquiry(statusData.inquiry)
          setNextStatus('Resolved')
        } else {
          await loadInquiry(false)
        }
      }

      // Step 2: Send the appropriate email.
      const endpoint =
        emailMode === 'resolution'
          ? `${API_URL}/api/inquiries/${inquiryId}/send-resolution-email`
          : `${API_URL}/api/inquiries/${inquiryId}/send-email`

      const payload =
        emailMode === 'resolution'
          ? { message: emailMessage.trim() }
          : {
              subject: emailSubject.trim(),
              message: emailMessage.trim(),
            }

      const emailResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      })

      const emailData = await readResponse(emailResponse)

      const successText =
        emailData.message ||
        (emailMode === 'resolution'
          ? 'Resolution email sent successfully.'
          : 'Follow-up email sent successfully.')

      setEmailSuccess(successText)
      setEmailMessage('')

      if (emailMode === 'resolution') {
        setSuccessMessage(successText)
        await loadInquiry(false)
      }
    } catch (err) {
      if (emailMode === 'resolution' && resolutionStatusSaved) {
        // The status may already be Resolved even if email delivery fails.
        // Keep the updated state and allow the user to retry the email.
        setEmailError(
          `The inquiry is Resolved, but the email could not be sent: ${
            err.message || 'Please try again.'
          }`,
        )

        setInquiry((previous) =>
          previous
            ? { ...previous, status: 'Resolved' }
            : previous,
        )
        setNextStatus('Resolved')
        await loadInquiry(false)
      } else {
        setEmailError(err.message || 'Failed to send the email.')
      }
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-gray-500">
            Loading inquiry details...
          </p>
        </div>
      </AdminLayout>
    )
  }

  if (error && !inquiry) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-3xl p-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-5 text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-800">
              Unable to open inquiry
            </h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => loadInquiry()}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!inquiry) {
    return (
      <AdminLayout>
        <div className="p-6 text-sm text-gray-500">
          Inquiry not found.
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {/* Page heading */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="mb-3 text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to inquiries
            </button>

            <h1 className="text-2xl font-bold text-gray-900">
              Inquiry #{inquiry.id}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View customer details and manage this inquiry.
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyle(
              currentStatus,
            )}`}
          >
            {currentStatus || 'Unknown'}
          </span>
        </div>

        {/* General feedback */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        {/* Inquiry and customer information */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer Message
              </h2>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Subject
                </p>
                <p className="mt-2 break-words font-medium text-gray-900">
                  {inquiry.subject || 'No subject provided'}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Description
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                  {inquiry.message ||
                    inquiry.description ||
                    'No message provided'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Inquiry Information
              </h2>

              <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Inquiry ID
                  </dt>
                  <dd className="mt-2 text-sm text-gray-900">
                    #{inquiry.id}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </dt>
                  <dd className="mt-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                        currentStatus,
                      )}`}
                    >
                      {currentStatus || 'Unknown'}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Created At
                  </dt>
                  <dd className="mt-2 text-sm text-gray-900">
                    {formatDate(inquiry.created_at)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Last Updated
                  </dt>
                  <dd className="mt-2 text-sm text-gray-900">
                    {formatDate(inquiry.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Customer contact details */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer Details
              </h2>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer Name
                </p>
                <p className="mt-2 break-words text-sm font-medium text-gray-900">
                  {inquiry.customer_name || 'Not provided'}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email Address
                </p>
                <p className="mt-2 break-all text-sm text-gray-700">
                  {inquiry.customer_email || 'Not provided'}
                </p>
              </div>

              {inquiry.customer_phone && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone Number
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    {inquiry.customer_phone}
                  </p>
                </div>
              )}
            </div>

            {/* Status management */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Update Status
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Choose the next status for this inquiry.
              </p>

              <label
                htmlFor="inquiry-status"
                className="mt-5 block text-sm font-medium text-gray-700"
              >
                Inquiry Status
              </label>

              <select
                id="inquiry-status"
                value={nextStatus}
                onChange={(event) => {
                  setNextStatus(event.target.value)
                  setError('')
                  setSuccessMessage('')
                }}
                disabled={isResolved || savingStatus || sendingEmail}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                {STATUSES.map((status) => {
                  const isAllowed =
                    status === currentStatus ||
                    (currentStatus === 'New' &&
                      ['In Progress', 'Resolved'].includes(status)) ||
                    (currentStatus === 'In Progress' &&
                      status === 'Resolved')

                  return (
                    <option
                      key={status}
                      value={status}
                      disabled={!isAllowed}
                    >
                      {status}
                    </option>
                  )
                })}
              </select>

              <button
                type="button"
                onClick={updateStatus}
                disabled={
                  !nextStatus ||
                  savingStatus ||
                  sendingEmail ||
                  isResolved ||
                  nextStatus === currentStatus ||
                  nextStatus === 'Resolved'
                }
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingStatus ? 'Updating...' : 'Update Status'}
              </button>

              {nextStatus === 'Resolved' && !isResolved && (
                <p className="mt-3 text-xs leading-5 text-blue-700">
                  To resolve this inquiry, use Resolve & Notify Customer
                  so you can provide the resolution message.
                </p>
              )}

              {isResolved && (
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  This inquiry is resolved. You can still retry the
                  resolution email below.
                </p>
              )}
            </div>

            {/* Customer communication actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Admin Actions
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Communicate with the customer about this inquiry.
              </p>

              <button
                type="button"
                onClick={openEmailComposer}
                disabled={sendingEmail}
                className="mt-5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send Follow-up Email
              </button>

              <button
                type="button"
                onClick={openResolutionComposer}
                disabled={
                  sendingEmail ||
                  (!isResolved && nextStatus !== 'Resolved')
                }
                className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResolved
                  ? 'Retry / Send Resolution Email'
                  : 'Resolve & Notify Customer'}
              </button>
            </div>
          </aside>
        </div>

        {/* Email composer modal */}
        {emailMode && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeEmailComposer()
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="email-modal-title"
              className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="email-modal-title"
                    className="text-xl font-bold text-gray-900"
                  >
                    {emailMode === 'resolution'
                      ? 'Resolve & Notify Customer'
                      : 'Send Follow-up Email'}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    To: {inquiry.customer_email || 'Customer email unavailable'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEmailComposer}
                  disabled={sendingEmail}
                  aria-label="Close email composer"
                  className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              {emailMode === 'resolution' && !isResolved && (
                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                  Submitting this message will first mark the inquiry
                  as Resolved, then send the resolution email.
                </div>
              )}

              {emailMode === 'resolution' && isResolved && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm leading-6 text-green-800">
                  The inquiry is already Resolved. Submitting will send
                  the resolution email without changing its status.
                </div>
              )}

              {emailError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
                >
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div
                  role="status"
                  className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm leading-6 text-green-700"
                >
                  {emailSuccess}
                </div>
              )}

              <form onSubmit={sendEmail} className="mt-5 space-y-4">
                {emailMode === 'follow-up' && (
                  <div>
                    <label
                      htmlFor="email-subject"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Subject
                    </label>

                    <input
                      id="email-subject"
                      type="text"
                      value={emailSubject}
                      onChange={(event) =>
                        setEmailSubject(event.target.value)
                      }
                      maxLength={200}
                      required
                      disabled={sendingEmail}
                      placeholder="Enter email subject"
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email-message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {emailMode === 'resolution'
                      ? 'Resolution Message'
                      : 'Message'}
                  </label>

                  <textarea
                    id="email-message"
                    value={emailMessage}
                    onChange={(event) =>
                      setEmailMessage(event.target.value)
                    }
                    rows={6}
                    maxLength={5000}
                    required
                    disabled={sendingEmail}
                    placeholder={
                      emailMode === 'resolution'
                        ? 'Explain how the customer inquiry was resolved...'
                        : 'Write your follow-up message...'
                    }
                    className="mt-2 w-full resize-y rounded-xl border border-gray-300 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />

                  <p className="mt-1 text-right text-xs text-gray-400">
                    {emailMessage.length}/5000
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEmailComposer}
                    disabled={sendingEmail}
                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={sendingEmail || !emailMessage.trim()}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingEmail
                      ? emailMode === 'resolution'
                        ? 'Resolving & Sending...'
                        : 'Sending Email...'
                      : emailMode === 'resolution'
                        ? isResolved
                          ? 'Send Resolution Email'
                          : 'Resolve & Send Email'
                        : 'Send Follow-up Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
