import { useUser } from '@clerk/clerk-react'
import { createFileRoute, Link, Outlet} from '@tanstack/react-router'
import '../../images/NoEntry.png'

export const Route = createFileRoute<any>('/protected')({
  component: RouteComponent,
})

const NotSignedIn: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen  p-4">
      <div className="rounded-2xl shadow-xl max-w-md w-full p-10 text-center">
        <img src='/NoEntry.png' alt="No Entry" className='w-[500px] h-[500px]' />
        <Link
          to="/"
          className="btn btn-outline btn-primary text-white border-2 btn-lg">
          Login
        </Link>
      </div>
    </div>
  );
};


function RouteComponent() {

  if (!useUser().isSignedIn) return <NotSignedIn />

  return <Outlet />
}