import Loader from '@/components/loader'
import { AuthProvider } from '@/context/AuthContext'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/protected/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthProvider><Loader><Outlet /></Loader></AuthProvider>)
}
