import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="ml-64 pt-16 min-h-screen">
        <Header />
        <main className="p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

