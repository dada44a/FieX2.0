import { createLazyFileRoute } from '@tanstack/react-router';

import { useRef } from 'react';

import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';

export const Route = createLazyFileRoute('/protected/user/profile/$ticketid/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { ticketid } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['ticketDetails', ticketid],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/tickets/${ticketid}/qr`);
      if (!res.ok) throw new Error('Failed to fetch ticket details');
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="flex justify-center items-center py-10 h-screen">
      <div className="card bg-base-200 w-[800px] h-3/5 shadow-xl border border-base-300">
        <div className="card-body space-y-6">

          {/* Title */}
          <h2 className="card-title text-2xl font-bold text-primary ">
            🎟️ Your Ticket
          </h2>

          {/* QR + Info */}
          <div className="flex gap-5 items-center">

            {/* QR */}
            <div className="p-2 rounded-xl bg-white shadow-sm border">
              <img
                src={data?.qrCode}
                alt="QR Code"
                className="w-70 h-70 object-contain"
              />
            </div>

            {/* Ticket Info */}
            <div className="space-y-1 text-lg">
              <p><span className="font-semibold">Movie:</span> {data?.data.movie}</p>
              <p><span className="font-semibold">Genre:</span> {data?.data.genre}</p>
              <p><span className="font-semibold">Screen:</span> {data?.data.screen}</p>
              <p><span className="font-semibold">Show Time:</span> {data?.data.showTime}</p>
              <p><span className="font-semibold">Show Date:</span> {data?.data.showDate}</p>
              <p><span className="font-semibold">Seats:</span> {data?.data.seats.join(', ')}</p>
            </div>

          </div>

          {/* Divider */}
          <div className="divider my-0"></div>

          {/* Footer / Action */}
          <button className="btn btn-primary w-full">
            Download Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

