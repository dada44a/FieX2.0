
import MovieManagement from '@/components/Admin/MovieManagement';
import Card from '@/components/Card';
import { createFileRoute } from '@tanstack/react-router'
import { TrendingUp, TrendingDown } from "lucide-react";
import React, { Suspense } from 'react';
import { useState } from 'react';
export const Route = createFileRoute('/protected/admin/')({
  component: RouteComponent,
})


const ScreenManagement = React.lazy(() => import('@/components/Admin/ScreenManagement'));
const ShowManagement = React.lazy(() => import('@/components/Admin/ShowManagement'));
const TicketBookings = React.lazy(() => import('@/components/Admin/TicketBookings'));
const UserManagement = React.lazy(() => import('@/components/Admin/UserManagement'));



function RouteComponent() {
  const [tabs, setTabs] = useState(0);
  return (
    <main className="min-h-screen py-8 px-8">
      <div className="cineverse-container">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card title="Total Movies">
            <p className="text-2xl font-bold">6</p>
            <div className="flex items-center text-gray-400">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500 " />
              <TrendingDown className="mr-1 h-3 w-3 text-red-400 hidden" />
              <p className="text-[12px]">+2 this week</p>
            </div>
          </Card>
          <Card title="Total Shows">
            <p className="text-2xl font-bold">6</p>
            <div className="flex items-center text-gray-400">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500 hidden" />
              <TrendingDown className="mr-1 h-3 w-3 text-red-400" />
              <p className="text-[12px]">+2 this week</p>
            </div>
          </Card>
          <Card title="Total Bookings">
            <p className="text-2xl font-bold">6</p>
            <div className="flex items-center text-gray-400">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500 " />
              <TrendingDown className="mr-1 h-3 w-3 text-red-400 hidden" />
              <p className="text-[12px]">+2 this week</p>
            </div>
          </Card>
          <Card title="Total Revenue">
            <p className="text-2xl font-bold">6</p>
            <div className="flex items-center text-gray-400">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500 hidden" />
              <TrendingDown className="mr-1 h-3 w-3 text-red-400" />
              <p className="text-[12px]">+2 this week</p>
            </div>
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
                    aria-label="Screens"
                    onClick={() => setTabs(4)}
                />
            </div>

            <div id="content" className="mt-3 p-4">
                <div className={tabs != 0 ? "hidden" : ""}> <Suspense fallback={<div className='skeleton h-[400px] w-screen'/>}><ShowManagement/></Suspense></div>
                <div className={tabs != 1 ? "hidden" : ""}><MovieManagement/></div>
                <div className={tabs != 2 ? "hidden" : ""}><Suspense fallback={<div className='skeleton h-[400px] w-screen'/>}><TicketBookings/></Suspense></div>
                <div className={tabs != 3 ? "hidden" : ""}><Suspense fallback={<div className='skeleton h-[400px] w-screen'/>}><UserManagement/></Suspense></div>
                <div className={tabs != 4 ? "hidden" : ""}><Suspense fallback={<div className='skeleton h-[400px] w-screen'/>}><ScreenManagement/></Suspense></div>
            </div>


    </main>
  )
}
