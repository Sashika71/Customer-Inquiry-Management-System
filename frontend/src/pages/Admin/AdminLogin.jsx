
import { useState } from 'react'
import { loginAdmin } from '../../services/authService'

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3.75" y="5.75" width="16.5" height="12.5" rx="1.5" />
      <path d="m4.25 6.5 7.75 6 7.75-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function EyeIcon({ hidden }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {hidden ? (
        <>
          <path d="m4 4 16 16" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.3A10.7 10.7 0 0 1 12 5c5.2 0 8.5 5 8.5 5a15 15 0 0 1-3.1 3.5M6.6 6.6C4.7 8 3.5 10 3.5 10s3.3 5 8.5 5c.7 0 1.4-.1 2-.2" />
        </>
      ) : (
        <>
          <path d="M3.5 12s3.3-5 8.5-5 8.5 5 8.5 5-3.3 5-8.5 5-8.5-5-8.5-5Z" />
          <circle cx="12" cy="12" r="2" />
        </>
      )}
    </svg>
  )
}

function EnvelopeArtwork() {
  return (
    <div
      className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center"
      aria-hidden="true"
    >
      <div className="absolute h-52 w-52 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="relative w-64 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-sm">
        <div className="mb-5 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-200/70" />
          <span className="h-2 w-2 rounded-full bg-white/40" />
          <span className="h-2 w-2 rounded-full bg-white/40" />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <MailIcon />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 w-24 rounded bg-slate-200" />
              <div className="h-2 w-16 rounded bg-slate-100" />
            </div>
          </div>

          <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-lg bg-blue-50">
            <div className="absolute top-0 h-14 w-14 rotate-45 border-b-2 border-r-2 border-blue-200" />
            <div className="z-10 flex h-11 w-14 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
              <MailIcon />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded bg-slate-100" />
            <div className="h-2 w-4/5 rounded bg-slate-100" />
          </div>
        </div>

        <div className="absolute -right-4 -top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-blue-500 text-xl text-white shadow-lg">
          ✓
        </div>
      </div>

      <div className="absolute bottom-3 left-4 h-12 w-12 rounded-full bg-blue-400/20 blur-xl" />
      <div className="absolute right-5 top-7 text-2xl text-blue-200">✦</div>
      <div className="absolute bottom-8 right-7 text-xl text-blue-200">+</div>
    </div>
  )
}

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email address and password.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await loginAdmin(email.trim(), password)

      localStorage.setItem('inquiryDeskToken', result.token)
      localStorage.setItem('inquiryDeskUser', JSON.stringify(result.user))

      window.location.href = '/dashboard'
    } catch (submitError) {
      setError(
        submitError instanceof TypeError
          ? 'Unable to connect to the server. Please try again.'
          : submitError.message
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-8 sm:px-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Staff Login
      </p>

      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:min-h-[570px] md:grid-cols-2">
        <aside className="flex flex-col justify-between bg-[#0b1736] p-8 text-white sm:p-10 lg:p-12">
          <a href="/" className="flex w-fit items-center gap-3 text-xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 p-2.5">
              <MailIcon />
            </span>
            Inquiry<span className="text-blue-300">Desk</span>
          </a>

          <div className="mt-10">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300 sm:text-base">
              Manage customer inquiries with clarity and confidence.
            </p>

            <div className="mt-6">
              <EnvelopeArtwork />
            </div>
          </div>

          <p className="mt-8 text-xs tracking-wide text-slate-400">
            Customer Support Workspace
          </p>
        </aside>

        <div className="flex flex-col justify-between p-8 sm:p-10 lg:p-12">
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your staff credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center rounded-lg border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="w-11 shrink-0 pl-4 text-slate-400">
                    <MailIcon />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="staff@company.com"
                    autoComplete="username"
                    required
                    className="w-full rounded-r-lg bg-transparent py-3.5 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center rounded-lg border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="w-11 shrink-0 pl-4 text-slate-400">
                    <LockIcon />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full min-w-0 bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    className="mr-3 w-6 shrink-0 text-slate-400 hover:text-blue-600"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon hidden={showPassword} />
                  </button>
                </div>
              </div>

              {error && (
                <p
                  className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="w-5">
                  <LockIcon />
                </span>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span className="w-4 text-slate-400">
                <LockIcon />
              </span>
              Authorized staff access only
            </div>
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Secure access to your customer support workspace.
          </p>
        </div>
      </section>

      <footer className="mt-6 text-center text-xs text-slate-400">
        InquiryDesk <span className="mx-1">·</span>
        Customer Inquiry Management System
      </footer>
    </main>
  )
}

export default AdminLogin
