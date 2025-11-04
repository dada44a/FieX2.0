
import { createLazyFileRoute } from '@tanstack/react-router'
import React from 'react';
import { Suspense } from 'react'
const UserProfileComponent = React.lazy(() => import('@/components/less_use/user_profile'));
export const Route = createLazyFileRoute('/protected/user/profile/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen p-4 flex flex-col gap-6">
      {/* use profile */}
      <Suspense fallback={<div>Loading profile...</div>}>
        <UserProfileComponent />
      </Suspense>



      {/* Booked Tickets */}
      <div className="card card-border bg-base-100 ">

        <div className="card-body  mb-4 rounded-2xl">
          <h2 className="card-title">Booked Tickets</h2>
          <p>You have booked 2 tickets for the movie.</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary">View Details</button>
          </div>
        </div>

        <div className="card-body mb-4 rounded-2xl">
          <h2 className="card-title">Booked Tickets</h2>
          <p>You have booked 2 tickets for the movie.</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary">View Details</button>
          </div>
        </div>

        <div className="card-body mb-4 rounded-2xl">
          <h2 className="card-title">Booked Tickets</h2>
          <p>You have booked 2 tickets for the movie.</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary">View Details</button>
          </div>
        </div>
      </div>
    </div>
  )
}
