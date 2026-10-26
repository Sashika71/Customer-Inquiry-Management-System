import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function statusStyle(status) {
  if (status === 'New' || status === 'Pending') return 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200'
  if (status === 'In Progress') return 'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200'
  if (status === 'Resolved') return 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200'
  return 'bg-slate-100 text-slate-600'
}

function formatDate(value, includeTime = true) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], includeTime
    ? { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' })
}

function InquiryDetails({ inquiryId }) {
  const [inquiry, setInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nextStatus, setNextStatus] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [message, setMessage] = useState('')
  const [showActions, setShowActions] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailMode, setEmailMode] = useState('follow-up')

  useEffect(() => {
    async function loadInquiry() {
      const token = localStorage.getItem('inquiryDeskToken')
      if (!token) {
        window.location.href = '/'
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/inquiries/${inquiryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await response.json()

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('inquiryDeskToken')
          localStorage.removeItem('inquiryDeskUser')
          window.location.href = '/'
          return
        }
        if (!response.ok) throw new Error(result.message || 'Unable to load inquiry.')
        setInquiry(result.inquiry)
      } catch (loadError) {
        setError(loadError.message || 'Unable to connect to the server.')
      } finally {
        setLoading(false)
      }
    }

    loadInquiry()
  }, [inquiryId])

  async function updateStatus() {
    if (!nextStatus) return
    setSavingStatus(true)
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/api/inquiries/${inquiryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('inquiryDeskToken')}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to update status.')
      setInquiry(result.inquiry)
      setNextStatus('')
      setMessage('Status updated successfully.')
    } catch (updateError) {
      setMessage(updateError.message)
    } finally {
      setSavingStatus(false)
    }
  }

  function openEmailComposer() {
    setEmailMode('follow-up')
    setEmailSubject(`Re: ${inquiry?.subject || 'Your inquiry'}`)
    setEmailMessage('')
    setEmailError('')
    setEmailSent(false)
    setShowActions(false)
    setShowEmailComposer(true)
  }

  function openResolutionComposer() {
    setEmailMode('resolution')
    setEmailSubject(`Resolution: ${inquiry?.subject || 'Your inquiry'}`)
    setEmailMessage('')
    setEmailError('')
    setEmailSent(false)
    setShowActions(false)
    setShowEmailComposer(true)
  }

  async function sendEmail(event) {
      event.preventDefault()
      setEmailError('')
      setSendingEmail(true)

      try {
        const endpoint = emailMode === 'resolution'
          ? `${API_URL}/api/inquiries/${inquiryId}/send-resolution-email`
          : `${API_URL}/api/inquiries/${inquiryId}/send-email`
        const body = emailMode === 'resolution'
          ? { message: emailMessage }
          : { subject: emailSubject, message: emailMessage }
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('inquiryDeskToken')}`,
          },
          body: JSON.stringify(body),
        })
        const result = await response.json()

        if (!response.ok) throw new Error(result.message || 'Unable to send email.')
        setEmailSent(true)
        if (emailMode === 'resolution') {
          setInquiry((current) => ({ ...current, status: 'Resolved' }))
        }
        setEmailMessage('')
      } catch (sendError) {
        setEmailError(sendError.message || 'Unable to send email.')
      } finally {
        setSendingEmail(false)
    }
  }

  if (loading) {
    return <AdminLayout activePage="inquiries"><main className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-500">Loading inquiry...</main></AdminLayout>
  }

  if (error || !inquiry) {
    return <AdminLayout activePage="inquiries"><main className="min-h-screen bg-slate-50 p-8"><div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Inquiry not found.'}</div></main></AdminLayout>
  }

  const displayStatus = inquiry.status === 'Pending' ? 'New' : inquiry.status
  const customerInitials = (inquiry.customer_name || 'CU').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  return (
    <AdminLayout activePage="inquiries">
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-4 text-xs text-slate-400">
            Dashboard <span className="mx-2">›</span> All Inquiries <span className="mx-2">›</span> <span className="text-slate-600">Inquiry Details</span>
          </div>
          <a href="/all-inquiries" className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-600">← Back to All Inquiries</a>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Inquiry #INQ-{inquiry.id}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(displayStatus)}`}>{displayStatus}</span>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setShowActions((visible) => !visible)} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">Actions ▾</button>
              {showActions && <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button type="button" onClick={() => document.getElementById('status-select')?.focus()} className="block w-full rounded px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50">Update Status</button>
                <button type="button" onClick={openEmailComposer} className="block w-full rounded px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50">Send Email to Customer</button>
              </div>}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-bold text-slate-800">Customer Message</h2></div>
              <div className="p-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">{inquiry.subject || 'No subject'}</h3>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{inquiry.message || 'No message provided.'}</p>
                <div className="mt-6 flex items-center gap-3 rounded-md bg-slate-50 p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{customerInitials}</span>
                  <div className="min-w-0"><p className="text-xs font-semibold text-slate-800">{inquiry.customer_name || 'Unknown customer'}</p><p className="text-xs text-slate-500">{inquiry.customer_email || 'No email available'}</p></div>
                  {inquiry.customer_phone && <span className="ml-auto text-xs text-slate-500">{inquiry.customer_phone}</span>}
                </div>
                <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">Submitted: {formatDate(inquiry.created_at)}</p>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-bold text-slate-800">Inquiry Information</h2></div>
              <div className="space-y-4 p-5 text-xs">
                <div className="grid grid-cols-2 gap-4"><div><p className="text-slate-400">Inquiry ID</p><p className="mt-1 font-medium text-slate-700">INQ-{inquiry.id}</p></div><div><p className="text-slate-400">Status</p><p className="mt-1 font-medium text-slate-700">{displayStatus}</p></div></div>
                <div className="grid grid-cols-2 gap-4"><div><p className="text-slate-400">Created Date</p><p className="mt-1 font-medium text-slate-700">{formatDate(inquiry.created_at)}</p></div><div><p className="text-slate-400">Customer Contact</p><p className="mt-1 font-medium text-slate-700">{inquiry.customer_email || '—'}</p></div></div>
                <div className="border-t border-slate-100 pt-4"><label htmlFor="status-select" className="text-slate-400">Change status</label><div className="mt-2 flex gap-2"><select id="status-select" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="h-9 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600"><option value="">Select status</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option></select><button type="button" onClick={updateStatus} disabled={!nextStatus || savingStatus} className="rounded-md bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">{savingStatus ? 'Saving...' : 'Update'}</button></div></div>
                {message && <p className="text-xs text-blue-600">{message}</p>}
              </div>
            </section>
          </div>
          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Admin Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg text-orange-500">✉</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Request More Information</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Ask the customer for additional details about this inquiry.</p>
                  </div>
                </div>
                <button type="button" onClick={openEmailComposer} className="mt-3 w-full rounded-full border border-blue-400 bg-white py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50">Request More Information</button>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg text-emerald-500">✓</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Resolve Inquiry</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Send a resolution email and close this inquiry.</p>
                  </div>
                </div>
                <button type="button" onClick={openResolutionComposer} disabled={displayStatus === 'Resolved'} className="mt-3 w-full rounded-full border border-blue-400 bg-white py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">Resolve &amp; Notify Customer</button>
              </div>
            </div>
          </section>
        </div>
      </main>
      {showEmailComposer && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="email-dialog-title">
          <section className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 id="email-dialog-title" className="text-base font-bold text-slate-900">{emailMode === 'resolution' ? 'Resolve & Notify Customer' : 'Request More Information'}</h2>
                <p className="mt-1 text-xs text-slate-500">{emailMode === 'resolution' ? 'Send the resolution details to the customer.' : 'Send a follow-up message about this inquiry.'}</p>
              </div>
              <button type="button" onClick={() => setShowEmailComposer(false)} aria-label="Close email composer" className="text-xl leading-none text-slate-400 hover:text-slate-700">×</button>
            </div>
            <form onSubmit={sendEmail} className="space-y-4 p-6">
              <div>
                <label htmlFor="recipient" className="mb-1.5 block text-xs font-semibold text-slate-600">To</label>
                <input id="recipient" value={inquiry.customer_email || 'No email available'} readOnly className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500" />
              </div>
              <div>
                {emailMode === 'follow-up' && <><label htmlFor="email-subject" className="mb-1.5 block text-xs font-semibold text-slate-600">Subject</label>
                <input id="email-subject" value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} maxLength={200} required className="h-10 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></>}
              </div>
              <div>
                <label htmlFor="email-message" className="mb-1.5 block text-xs font-semibold text-slate-600">Message</label>
                <textarea id="email-message" value={emailMessage} onChange={(event) => setEmailMessage(event.target.value)} maxLength={5000} rows={6} placeholder="Write your message to the customer..." required className="w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                <p className="mt-1 text-right text-[10px] text-slate-400">{emailMessage.length}/5000</p>
              </div>
              {emailError && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{emailError}</p>}
              {emailSent && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700" role="status">Email sent successfully.</p>}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowEmailComposer(false)} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={sendingEmail || !inquiry.customer_email} className="rounded-md bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{sendingEmail ? 'Sending...' : emailMode === 'resolution' ? 'Resolve & Notify' : 'Send Email'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AdminLayout>
  )
}

export default InquiryDetails
