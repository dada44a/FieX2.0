import {
  SignedOut,
  SignedIn,
  SignInButton,
  SignOutButton,
  ClerkLoaded,
  ClerkLoading,
  useUser,
} from '@clerk/clerk-react'

export default function UserProfileComponent() {
  const { user } = useUser()

  return (
    <div className="card card-bordered bg-base-100 flex flex-col items-center p-6">
      {/* Avatar */}
      <div className="avatar mb-4">
        <SignedOut>
          <div className="w-40 rounded-full">
            <img
              loading="lazy"
              src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
              alt="Guest Avatar"
            />
          </div>
        </SignedOut>

        <SignedIn>
          <ClerkLoading>
            <div className="skeleton h-40 w-40 rounded-full" />
          </ClerkLoading>
          <ClerkLoaded>
            <img
              loading="lazy"
              src={user?.imageUrl}
              alt={user?.fullName || 'User Avatar'}
              className="w-40 h-40 rounded-full"
            />
          </ClerkLoaded>
        </SignedIn>
      </div>

      {/* User Info */}
      <div className="card-body text-center">
        <SignedOut>
          <h2 className="text-3xl font-semibold my-4">
            Anish Ghimire{' '}
            <span className="font-normal text-[18px] text-gray-300">10 Points</span>
          </h2>
        </SignedOut>

        <SignedIn>
          <ClerkLoading>
            <div className="skeleton h-8 w-48 mx-auto my-4 rounded-xl" />
          </ClerkLoading>
          <ClerkLoaded>
            <h2 className="text-3xl font-semibold my-4">
              {user?.fullName}{' '}
              <span className="font-normal text-[18px] text-gray-300">10 Points</span>
            </h2>
            <p className="text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
          </ClerkLoaded>
        </SignedIn>

        {/* Action Buttons */}
        <div className="card-actions justify-center mt-4 flex gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-ghost border-2 border-white">Sign In</button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <SignOutButton>
              <button className="btn btn-ghost border-2 border-white">Sign Out</button>
            </SignOutButton>
          </SignedIn>
        </div>
      </div>
    </div>
  )
}
