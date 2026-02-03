
import MovieManagement from '@/components/Admin/MovieManagement';
import Card from '@/components/Card';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'
import React, { Suspense } from 'react';
import { useState } from 'react';


interface MonthlyStatsResponse {
  month: string;
  totalMovies: number;
  totalShows: number;
  totalBookings: number;
  totalRevenue: string;
}
export const Route = createFileRoute('/protected/admin/')({
  component: RouteComponent,
})

const ScreenManagement = React.lazy(() => import('@/components/Admin/ScreenManagement'));
const ShowManagement = React.lazy(() => import('@/components/Admin/ShowManagement'));
const TicketBookings = React.lazy(() => import('@/components/Admin/TicketBookings'));
const UserManagement = React.lazy(() => import('@/components/Admin/UserManagement'));
const RequestManagement = React.lazy(() => import('@/components/Admin/RequestManagement'));



function RouteComponent() {
  const [tabs, setTabs] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['monthly-stats'],
    queryFn: async (): Promise<MonthlyStatsResponse> => {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/reports/monthly-stats`);
      if (!res.ok) throw new Error('Failed to fetch monthly stats');
      return res.json();
    }
  })

  isError && <p className="text-red-500">Failed to load data</p>;
  return (
    <main className="min-h-screen py-8 px-8">
      <div className="cineverse-container">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card title="Total Movies">
            {isLoading ? (
              <div className='skeleton w-full h-5'></div>
            ) : (
              <p className="text-2xl font-bold">{data?.totalMovies ?? '-'}</p>
            )}
          </Card>
          <Card title="Total Shows">
            {isLoading ? (
              <div className='skeleton w-full h-5'></div>
            ) : (
              <p className="text-2xl font-bold">{data?.totalShows ?? '-'}</p>
            )}
          </Card>
          <Card title="Total Bookings">
            {isLoading ? (
              <div className='skeleton w-full h-5'></div>
            ) : (
              <p className="text-2xl font-bold">{data?.totalBookings ?? '-'}</p>
            )}
          </Card>
          <Card title="Total Revenue">
            {isLoading ? (
              <div className='skeleton w-full h-5'></div>
            ) : (
              <p className="text-2xl font-bold">Rs. {data?.totalRevenue ?? '-'}</p>
            )}
          </Card>
        </div>

        {/* name of each tab group should be unique
        <Tabs/> */}
      </div>


      <div className="tabs tabs-box mt-6">
        <input
          type="radio"
          name="my_tabs_1"
          className="tab"
          aria-label="Show Management"
          defaultChecked
          onClick={() => setTabs(0)}
        />
        <input
          type="radio"
          name="my_tabs_1"
          className="tab"
          aria-label="Movie Management"
          onClick={() => setTabs(1)}
        />
        <input
          type="radio"
          name="my_tabs_1"
          className="tab "
          aria-label="Bookings"
          onClick={() => setTabs(2)}
        />
        <input
          type="radio"
          name="my_tabs_1"
          className="tab "
          aria-label="Users"
          onClick={() => setTabs(3)}
        />
        <input
          type="radio"
          name="my_tabs_1"
          className="tab "
          onClick={() => setTabs(4)}
        />
        <input
          type="radio"
          name="my_tabs_1"
          className="tab "
          aria-label="Requests"
          onClick={() => setTabs(5)}
        />
      </div>

      <div id="content" className="mt-3 p-4">
        <div className={tabs != 0 ? "hidden" : ""}> <Suspense fallback={<div className='skeleton h-[400px] w-screen' />}><ShowManagement /></Suspense></div>
        <div className={tabs != 1 ? "hidden" : ""}><MovieManagement /></div>
        <div className={tabs != 2 ? "hidden" : ""}><Suspense fallback={<div className='skeleton h-[400px] w-screen' />}><TicketBookings /></Suspense></div>
        <div className={tabs != 3 ? "hidden" : ""}><Suspense fallback={<div className='skeleton h-[400px] w-screen' />}><UserManagement /></Suspense></div>
        <div className={tabs != 4 ? "hidden" : ""}><Suspense fallback={<div className='skeleton h-[400px] w-screen' />}><ScreenManagement /></Suspense></div>
        <div className={tabs != 5 ? "hidden" : ""}><Suspense fallback={<div className='skeleton h-[400px] w-screen' />}><RequestManagement /></Suspense></div>
      </div>


    </main>
  )
}
