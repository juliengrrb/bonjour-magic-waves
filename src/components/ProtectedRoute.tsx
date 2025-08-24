import { useAuth } from "@/contexts/AuthContext"
import { Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { isDemoMode } from '@/integrations/supabase/client'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // En mode démo, toujours autoriser l'accès
  if (isDemoMode) {
    return <>{children}</>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}