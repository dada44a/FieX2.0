import { createLazyFileRoute } from '@tanstack/react-router';

import { useRef } from 'react';

import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';

export const Route = createLazyFileRoute('/protected/user/profile/$ticketid/')({
  component: RouteComponent,
});

interface TicketData {
  id: number;
  customerId: string;
  showId: number;
  movieTitle?: string;
  showDate?: string;
  showTime?: string;
  seats?: string[];
  paymentMethod?: string;
  transactionId?: string;
  mobile?: string;
}

function RouteComponent() {
  const params = Route.useParams();
  const { user, isLoaded } = useUser();
  const customerId = user?.id;
  const ticketRef = useRef<HTMLDivElement | null>(null);

  const { data: ticket, isLoading, error } = useQuery<TicketData | null>({
    queryKey: ['ticket', customerId, params.ticketid],
    queryFn: async () => {
      if (!customerId) return null;

      const res = await fetch(
        `${import.meta.env.VITE_API_LINK}/api/tickets/user/${customerId}/details`
      );
      if (!res.ok) throw new Error('Failed to fetch ticket');

      const json = await res.json();
      if (!Array.isArray(json.data)) return null;

      return json.data.find((t: any) => t.id.toString() === params.ticketid) || null;
    },
    enabled: !!customerId && isLoaded,
  });

  // const downloadTicket = async () => {
  //   if (!ticketRef.current || !ticket) return;

  //   try {
  //     const canvas = await html2canvas(ticketRef.current, {
  //       backgroundColor: '#1f2937',
  //       scale: 3,
  //       useCORS: true,
  //     });

  //     // toBlob is async – wrap it in a promise so we can await it
  //     const blob = await new Promise<Blob | null>((resolve) =>
  //       canvas.toBlob((b) => resolve(b), 'image/png')
  //     );

  //     if (blob) saveAs(blob, `ticket_${ticket.id}.png`);
  //   } catch (err) {
  //     console.error('Ticket download error:', err);
  //   }
  // };

  if (isLoading) return <p className="text-center mt-10 text-white">Loading ticket...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">Failed to load ticket.</p>;
  if (!ticket) return <p className="text-center mt-10 text-white">Ticket not found</p>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        ref={ticketRef}
        className="bg-gray-800 shadow-lg rounded-2xl p-6 w-full max-w-md relative"
      >
        <h2 className="text-2xl font-bold mb-2 text-center text-white">
          {ticket.movieTitle || 'Movie Ticket'}
        </h2>
        <p className="text-center text-white mb-4">
          Show: {ticket.showDate || 'N/A'} | {ticket.showTime || 'N/A'}
        </p>

        <div className="flex justify-between mb-4">
          <div className="text-white">
            <p><strong>Seats:</strong> {ticket.seats?.join(', ') || 'N/A'}</p>
            <p><strong>Payment:</strong> {ticket.paymentMethod || 'N/A'}</p>
            <p><strong>Transaction ID:</strong> {ticket.transactionId || 'N/A'}</p>
            <p><strong>Mobile:</strong> {ticket.mobile || 'N/A'}</p>
          </div>
          <div>
            <div className="bg-white p-2 rounded-lg inline-block">
              {/* <QRCodeSVG value={JSON.stringify(ticket)} size={120} /> */}
            </div>
          </div>

        </div>

        <button
   
          className="btn btn-primary w-full mt-4"
        >
          Download Ticket
        </button>
      </div>
    </div>
  );
}
