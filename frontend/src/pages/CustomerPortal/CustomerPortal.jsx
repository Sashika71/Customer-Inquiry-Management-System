import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function MailIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="m4 6.25 8 6 8-6" /></svg>
}

function CustomerPortal() {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submitInquiry(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          subject: form.subject,
          message: form.message,
        }),
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Unable to submit your inquiry.')

      setReferenceNumber(`INQ-${result.inquiry.id}`)
      setSuccess('submitted')
      setForm({ customer_name: '', customer_email: '', subject: '', message: '' })
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit your inquiry.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="mx-auto max-w-[1050px]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 px-5 py-4">
              <a href="/customer-portal" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="h-5 w-5 text-blue-600"><MailIcon /></span>
                Inquiry<span className="font-normal">Desk</span>
              </a>
            </header>
            <div className="flex min-h-[550px] flex-col items-center justify-center px-5 py-12 text-center">
              <div className="relative mb-6">
                <span className="absolute -left-12 top-1/2 text-lg text-blue-200">◆</span>
                <span className="absolute -right-12 top-1/2 text-lg text-emerald-100">◆</span>
                <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                  <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Your inquiry has been submitted!</h1>
              <p className="mt-3 max-w-sm text-xs leading-5 text-slate-500">Thank you for reaching out. We&apos;ve received your inquiry<br className="hidden sm:block" /> and our team will get back to you soon.</p>
              <div className="mt-6 w-full max-w-[260px] rounded-md bg-blue-50 px-5 py-4">
                <p className="text-[10px] font-medium text-slate-500">Reference Number</p>
                <p className="mt-1 text-xs font-bold text-slate-700">#{referenceNumber}</p>
              </div>
              <button type="button" onClick={() => { setSuccess(''); setReferenceNumber('') }} className="mt-6 rounded-md bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
                Submit Another Inquiry <span className="ml-2">→</span>
              </button>
              <a href="/" className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800">Back to Home</a>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-[1050px]">
        <p className="mb-3 text-xs font-semibold text-slate-700">
          Customer Portal <span className="font-normal text-blue-600">(Submit Inquiry)</span>
        </p>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <a href="/customer-portal" className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="h-5 w-5 text-blue-600"><MailIcon /></span>
              Inquiry<span className="font-normal">Desk</span>
            </a>
            <a href="/" className="text-[10px] text-slate-400 hover:text-blue-600">← Back to Home</a>
          </header>

          <div className="grid gap-8 p-5 md:grid-cols-[1.15fr_.7fr] md:p-7">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Submit an Inquiry</h1>
              <p className="mt-1 text-xs text-slate-500">Tell us how we can help, and our team will review your request.</p>

              <form onSubmit={submitInquiry} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="customer_name" className="mb-1.5 block text-[11px] font-semibold text-slate-700">Full Name <span className="text-blue-600">*</span></label>
                  <input id="customer_name" name="customer_name" value={form.customer_name} onChange={updateField} placeholder="Enter your full name" maxLength={100} required className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label htmlFor="customer_email" className="mb-1.5 block text-[11px] font-semibold text-slate-700">Email Address <span className="text-blue-600">*</span></label>
                  <input id="customer_email" name="customer_email" type="email" value={form.customer_email} onChange={updateField} placeholder="Enter your email address" maxLength={255} required className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label htmlFor="subject" className="mb-1.5 block text-[11px] font-semibold text-slate-700">Subject <span className="text-blue-600">*</span></label>
                  <input id="subject" name="subject" value={form.subject} onChange={updateField} placeholder="Enter a subject" maxLength={200} required className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label htmlFor="message" className="mb-1.5 block text-[11px] font-semibold text-slate-700">Inquiry Description <span className="text-blue-600">*</span></label>
                  <textarea id="message" name="message" value={form.message} onChange={updateField} placeholder="Describe your inquiry in detail..." required rows={5} className="w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-xs leading-5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
                {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
                {success && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{success}</p>}
                <div className="flex items-center gap-4 pt-1">
                  <button type="submit" disabled={submitting} className="rounded-md bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit Inquiry'}</button>
                  <button type="button" onClick={() => setForm({ customer_name: '', customer_email: '', subject: '', message: '' })} className="text-xs font-semibold text-slate-500 hover:text-blue-600">Clear Form</button>
                </div>
              </form>
            </div>

            <aside className="relative hidden min-h-[430px] overflow-hidden rounded-md bg-blue-50/70 p-8 md:block">
              <div className="absolute -bottom-16 -right-10 h-40 w-64 rounded-[45%] bg-blue-100/70" />
              <div className="relative flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-blue-100 text-blue-600 shadow-inner"><span className="h-10 w-10"><MailIcon /></span></div>
                <h2 className="text-sm font-bold text-slate-800">Need help?<br />We&apos;re here for you!</h2>
                <p className="mt-3 max-w-[180px] text-xs leading-5 text-slate-500">Fill out the form and our support team will get back to you soon.</p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

export default CustomerPortal
