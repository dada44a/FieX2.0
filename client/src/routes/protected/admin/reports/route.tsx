import { createFileRoute, Outlet } from '@tanstack/react-router'
import AdminLoader from '@/components/adminloader'

export const Route = createFileRoute('/protected/admin/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return (<AdminLoader>
    <Outlet />
  </AdminLoader>)
}
