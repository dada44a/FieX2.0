import { createFileRoute } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import axios from 'axios'

export const Route = createFileRoute('/test-jwt')({
    component: TestJWTComponent,
})

function TestJWTComponent() {
    const { user, isLoaded } = useUser()
    const [status, setStatus] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSetJWTCookie = async () => {
        if (!user) {
            setStatus('User not logged in')
            return
        }

        setLoading(true)
        setStatus('Setting JWT cookie...')

        try {
            const email = user.primaryEmailAddress?.emailAddress
            if (!email) {
                setStatus('No email found for user')
                return
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_LINK}/api/test/jwt-cookie`,
                { email },
                { withCredentials: true }
            )

            if (response.data.success) {
                setStatus('Success: HTTP-only cookie set!')
            } else {
                setStatus(`Error: ${response.data.error || 'Unknown error'}`)
            }
        } catch (error: any) {
            console.error('JWT Error:', error)
            setStatus(`Error: ${error.response?.data?.error || error.message}`)
        } finally {
            setLoading(false)
        }
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">JWT Flow Test</h1>

            <div className="bg-base-200 p-6 rounded-xl shadow-lg border border-base-300">
                <div className="mb-4">
                    <p className="text-sm opacity-70">Logged in as:</p>
                    <p className="font-mono bg-base-300 p-2 rounded mt-1">
                        {user?.primaryEmailAddress?.emailAddress || 'Not logged in'}
                    </p>
                </div>

                <button
                    onClick={handleSetJWTCookie}
                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                    disabled={!user || loading}
                >
                    {loading ? 'Processing...' : 'Request JWT via HTTP-only Cookie'}
                </button>

                {status && (
                    <div className={`mt-6 p-4 rounded-lg border ${status.startsWith('Success')
                        ? 'bg-success/20 border-success text-success-content'
                        : 'bg-error/20 border-error text-error-content'
                        }`}>
                        <p className="font-medium">{status}</p>
                    </div>
                )}
            </div>

            <div className="mt-8 prose">
                <h3>How it works:</h3>
                <ol>
                    <li>Clerk email is sent to the backend.</li>
                    <li>Backend signs a JWT with the email.</li>
                    <li>Backend sends back "test_jwt" cookie with <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite=Lax</code>.</li>
                    <li>Check your browser DevTools (Network or Application tab) to see the cookie.</li>
                </ol>
            </div>
        </div>
    )
}
