import './AdminLayout.css'

function Icon({ name }) {
  const paths = {
    dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    inquiries: <><path d="M5 5.5h14v10H9l-4 3v-13Z" /><path d="M8 9h8M8 12h5" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></>,
  }

  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function AdminLayout({ activePage = 'dashboard', children }) {
  function logout() {
    localStorage.removeItem('inquiryDeskToken')
    localStorage.removeItem('inquiryDeskUser')
    window.location.href = '/'
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/dashboard">
          <span className="admin-brand-icon"><Icon name="inquiries" /></span>
          <span>Inquiry<span>Desk</span></span>
        </a>

        <nav className="admin-nav" aria-label="Staff navigation">
          <a className={activePage === 'dashboard' ? 'active' : ''} href="/dashboard">
            <Icon name="dashboard" /> Dashboard
          </a>
          <a className={activePage === 'inquiries' ? 'active' : ''} href="/all-inquiries">
            <Icon name="inquiries" /> All Inquiries
          </a>
        </nav>

        <div className="admin-sidebar-bottom">
          <button type="button" className="admin-logout" onClick={logout}>
            <Icon name="logout" /> Logout
          </button>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  )
}

export default AdminLayout
