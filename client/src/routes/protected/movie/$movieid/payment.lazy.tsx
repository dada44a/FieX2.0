import { createLazyFileRoute } from '@tanstack/react-router'
import React, { Suspense } from 'react';
const SeatSelection = React.lazy(() => import('@/components/less_use/seat_selection'));

export const Route = createLazyFileRoute('/protected/movie/$movieid/payment')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<div className='skeleton w-[400px] h-[300px]'/>}>
          <SeatSelection />
        </Suspense>

        {/* Payment Section */}
        <div className="card bg-base-100 w-96 shadow-sm">
          <div className="card-body">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Name?</legend>
              <input type="text" className="input" placeholder="Type here" required />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email</legend>
              <input type="email" className="input" placeholder="email@example.com" required />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Method</legend>
              <input type="text" className="input" placeholder="Type here" />
            </fieldset>

            <button className="btn btn-primary mt-3">Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  )
}
