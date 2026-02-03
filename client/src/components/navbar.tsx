import { SignedOut, SignInButton, SignedIn, UserButton } from '@clerk/clerk-react'
import { Link } from '@tanstack/react-router'
import React from 'react'

export const Navbar = React.memo(() => {
    return (
        <div className="navbar bg-base-100 shadow-sm z-50">
            <div className="flex-1">
                <Link to="/" className="btn btn-ghost text-xl">FireX</Link>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <SignedOut>
                            <SignInButton mode='modal' />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </li>
                    <li>
                        <details>
                            <summary>Pages</summary>
                            <ul className="bg-base-100 rounded-t-none p-2">
                                <li><Link to="/protected/user/profile">Profile</Link></li>
                                <li><Link to="/request-movie">Request Movie</Link></li>
                            </ul>
                        </details>
                    </li>
                </ul>
            </div>
        </div>
    )
}
)