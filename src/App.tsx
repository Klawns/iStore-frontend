import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/app-shell'
import Auth from './features/auth'
import Customers from './features/customers'
import Dashboard from './features/dashboard'
import Finance from './features/finance'
import PrivacyPolicy from './features/legal/privacy'
import TermsOfUse from './features/legal/terms'
import Privacy from './features/privacy'
import Sales from './features/sales'
import { useMe } from './services/api/hooks'

type RouteGuardProps = {
  children: ReactNode
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f9f9ff] px-4 text-[#141b2b]">
      <div className="flex items-center gap-3 rounded-lg border border-[#dfe4f5] bg-white px-4 py-3 text-sm font-medium shadow-sm">
        <span className="material-symbols-rounded text-[20px] text-[#0050cb]" aria-hidden="true">
          progress_activity
        </span>
        Carregando...
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: RouteGuardProps) {
  const me = useMe()

  if (me.isLoading) {
    return <LoadingScreen />
  }

  if (me.isError) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicOnlyRoute({ children }: RouteGuardProps) {
  const me = useMe()

  if (me.isLoading) {
    return <LoadingScreen />
  }

  if (me.isSuccess) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function RootRedirect() {
  const me = useMe()

  if (me.isLoading) {
    return <LoadingScreen />
  }

  return <Navigate to={me.isSuccess ? '/dashboard' : '/login'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Auth mode="login" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/registro"
        element={
          <PublicOnlyRoute>
            <Auth mode="register" />
          </PublicOnlyRoute>
        }
      />
      <Route path="/privacidade" element={<PrivacyPolicy />} />
      <Route path="/termos" element={<TermsOfUse />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <AppShell>
              <Sales />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <AppShell>
              <Customers />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <AppShell>
              <Finance />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lgpd"
        element={
          <ProtectedRoute>
            <AppShell>
              <Privacy />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

export default App
