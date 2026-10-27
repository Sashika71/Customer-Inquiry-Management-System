function Icon({ name }) {
  const paths = {
    dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    inquiries: <><path d="M5 5.5h14v10H9l-4 3v-13Z" /><path d="M8 9h8M8 12h5" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></>,
  }

  return <svg className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.7] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function AdminLayout({ activePage = 'dashboard', children }) {
  function logout() {
    localStorage.removeItem('inquiryDeskToken')
    localStorage.removeItem('inquiryDeskUser')
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen bg-[#f5f8fc] text-[#14213d] max-[700px]:block">
      <aside className="flex min-h-screen w-56 shrink-0 flex-col bg-linear-to-b from-[#041b3d] via-[#061b3d] to-[#082957] px-3 py-5 text-[#d7e4f8] max-[700px]:min-h-0 max-[700px]:w-full max-[700px]:p-3">
        <a className="flex items-center gap-2 px-3 pb-7 text-[15px] font-bold tracking-[-0.3px] text-white max-[700px]:px-2 max-[700px]:pb-3.5" href="/dashboard">
          <span className="h-[18px] w-[18px] text-[#7e9cff]"><Icon name="inquiries" /></span>
          <span>Inquiry<span className="font-normal">Desk</span></span>
        </a>

        <nav className="grid gap-1.5 max-[700px]:grid-cols-3" aria-label="Staff navigation">
          <a className={`flex min-h-[38px] items-center gap-[11px] rounded-md px-3 text-left text-[11px] text-[#c1d0e7] no-underline transition-colors duration-200 hover:bg-[rgba(54,105,190,0.35)] hover:text-white max-[700px]:justify-center max-[700px]:px-1 max-[700px]:text-[10px] ${activePage === 'dashboard' ? 'bg-linear-to-r from-[#1454b7] to-[#0d438e] text-white shadow-[inset_3px_0_#5c8efb]' : ''}`} href="/dashboard">
            <Icon name="dashboard" /> Dashboard
          </a>
          <a className={`flex min-h-[38px] items-center gap-[11px] rounded-md px-3 text-left text-[11px] text-[#c1d0e7] no-underline transition-colors duration-200 hover:bg-[rgba(54,105,190,0.35)] hover:text-white max-[700px]:justify-center max-[700px]:px-1 max-[700px]:text-[10px] ${activePage === 'inquiries' ? 'bg-linear-to-r from-[#1454b7] to-[#0d438e] text-white shadow-[inset_3px_0_#5c8efb]' : ''}`} href="/all-inquiries">
            <Icon name="inquiries" /> All Inquiries
          </a>
        </nav>

        <div className="mt-auto max-[700px]:flex max-[700px]:justify-end">
          <button type="button" className="flex min-h-[38px] w-full cursor-pointer items-center gap-[11px] rounded-md border-0 bg-transparent px-3 text-left text-[11px] text-[#c1d0e7] transition-colors duration-200 hover:bg-[rgba(54,105,190,0.35)] hover:text-white max-[700px]:w-auto max-[700px]:px-2" onClick={logout}>
            <Icon name="logout" /> Logout
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export default AdminLayout
