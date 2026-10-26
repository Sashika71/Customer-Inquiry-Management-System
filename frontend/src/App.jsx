
import AdminLogin from './pages/Admin/AdminLogin'
import DashboardPage from './pages/Admin/Dashboard'
import AllInquiries from './pages/Admin/AllInquiries'
import InquiryDetails from './pages/Admin/InquiryDetails'
import CustomerPortal from './pages/CustomerPortal/CustomerPortal'

function App() {
  const currentPath = window.location.pathname

  if (currentPath === '/dashboard') {
    return <DashboardPage />
  }
  if (currentPath === '/all-inquiries') {
    return <AllInquiries />
  }
  if (currentPath === '/customer-portal') {
    return <CustomerPortal />
  }
  const inquiryDetailsMatch = currentPath.match(/^\/inquiries\/(\d+)$/)
  if (inquiryDetailsMatch) {
    return <InquiryDetails inquiryId={inquiryDetailsMatch[1]} />
  }

  return <AdminLogin />
}

export default App
