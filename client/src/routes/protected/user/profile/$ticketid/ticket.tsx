import { createFileRoute } from '@tanstack/react-router';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';


export const Route = createFileRoute('/protected/user/profile/$ticketid/ticket')({
  component: TicketPage,
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

function TicketPage() {
  const params = Route.useParams();
  const { user, isLoaded } = useUser();
  const customerId = user?.id;
  const ticketRef = useRef(null);

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

  // const handleDownloadPDF = async () => {
  //   const ticketElement = ticketRef.current;
  //   if (!ticketElement || !ticket) return;

  //   const canvas = await html2canvas(ticketElement);

  //   console.log(canvas);

  //   const data = canvas.toDataURL('image/png');

  //   // const doc = new jsPDF({
  //   //   orientation: 'portrait',
  //   //   unit: 'px',
  //   //   format: "a4",
  //   // });

  //   // doc.addImage(data, 'PNG', 20, 20, 570, 0);
  //   const link = document.createElement('a');
  //   link.href = data;
  //   link.download = `ticket_${ticket.id}.png`;
  //   link.click();
  // }


  if (isLoading) return <p className="text-center mt-10 text-white">Loading ticket...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">Failed to load ticket.</p>;
  if (!ticket) return <p className="text-center mt-10 text-white">Ticket not found</p>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <div
        ref={ticketRef}
        className="bg-gray-800 shadow-lg rounded-2xl p-6 w-full max-w-md relative text-white"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">{ticket.movieTitle || 'Movie Ticket'}</h2>
        <p className="text-center mb-4">
          Show: {ticket.showDate || 'N/A'} | {ticket.showTime || 'N/A'}
        </p>

        <div className="flex justify-between mb-4">
          <div>
            <p><strong>Seats:</strong> {ticket.seats?.join(', ') || 'N/A'}</p>
            <p><strong>Payment:</strong> {ticket.paymentMethod || 'N/A'}</p>
            <p><strong>Transaction ID:</strong> {ticket.transactionId || 'N/A'}</p>
            <p><strong>Mobile:</strong> {ticket.mobile || 'N/A'}</p>
          </div>
          <div>
            <div className="bg-white p-2 rounded-lg inline-block">
              {/* <QRCode value={JSON.stringify(ticket)} size={120} /> */}
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


