import { ClerkProvider } from "@clerk/clerk-react"
import { Outlet } from "@tanstack/react-router"


const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

export default function Layout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Outlet/>
    </ClerkProvider>
  )
}
