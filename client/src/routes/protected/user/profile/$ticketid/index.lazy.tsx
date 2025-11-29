import { createLazyFileRoute } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';

export const Route = createLazyFileRoute('/protected/user/profile/$ticketid/')(({
  component: RouteComponent,
}));

function RouteComponent() {
  const { ticketid } = Route.useParams();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ticketDetails', ticketid],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/tickets/${ticketid}/qr`);
      if (!res.ok) throw new Error('Failed to fetch ticket details');
      const json = await res.json();
      return json.data;
    },
  });

  const handleDownload = async () => {
    if (!data) return;

    setIsDownloading(true);
    try {
      const doc = new jsPDF();

      // Add decorative header
      doc.setFillColor(25, 30, 36); // Dark background
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Movie Ticket', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Ticket ID: #${ticketid}`, 105, 30, { align: 'center' });

      // Movie Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(data.data.movie, 20, 60);

      // Ticket Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      let y = 80;
      const details = [
        { label: 'Genre', value: data.data.genre },
        { label: 'Screen', value: data.data.screen },
        { label: 'Date', value: data.data.showDate },
        { label: 'Time', value: data.data.showTime },
      ];

      details.forEach(detail => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}:`, 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value, 50, y);
        y += 10;
      });

      // Seats
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Seats:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.data.seats.join(', '), 50, y);

      // QR Code
      if (data.qrCode) {
        try {
          // If qrCode is a data URL, we can use it directly. 
          // If it's a URL, we might need to fetch it or add it as image.
          // Assuming it's a data URL based on previous code usage (img src={data.qrCode})
          doc.addImage(data.qrCode, 'PNG', 130, 50, 60, 60);
        } catch (e) {
          console.error("Error adding QR code to PDF", e);
        }
      }

      // Footer
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 250, 190, 250);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Please arrive 15 minutes before showtime.', 105, 260, { align: 'center' });
      doc.text('Carry a valid ID for verification.', 105, 265, { align: 'center' });

      doc.save(`ticket-${data.data.movie.replace(/\s+/g, '-') || ticketid}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate ticket PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="alert alert-error max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Error: {(error as Error).message}</span>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center py-10 min-h-screen px-4">
      <div
        ref={ticketRef}
        className="card bg-base-200 w-full max-w-4xl shadow-2xl border border-base-300 overflow-hidden"
        style={{ backgroundColor: '#1f2937' }}
      >
        <div className="card-body p-8 space-y-8">

          {/* Header with decorative element */}
          <div className="flex items-center justify-between border-b border-base-300 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
                🎟️ Your Ticket
              </h2>
              <p className="text-sm text-base-content/60 mt-1">Ticket ID: #{ticketid}</p>
            </div>
            <div className="badge badge-primary badge-lg">CONFIRMED</div>
          </div>

          {/* Main Content - QR + Info */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-2xl bg-white shadow-lg border-4 border-base-300 relative">
                <img
                  src={data?.qrCode}
                  alt="QR Code"
                  className="w-64 h-64 object-contain"
                />
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -translate-x-1 -translate-y-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary translate-x-1 -translate-y-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -translate-x-1 translate-y-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary translate-x-1 translate-y-1"></div>
              </div>
              <p className="text-sm text-base-content/60 text-center">Scan this code at the venue</p>
            </div>

            {/* Ticket Details Section */}
            <div className="space-y-6">
              {/* Movie Title - Featured */}
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4 rounded-xl border border-primary/30">
                <p className="text-xs text-base-content/60 uppercase tracking-wider mb-1">Movie</p>
                <h3 className="text-2xl font-bold text-primary">{data?.data.movie}</h3>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-base-300/50 p-4 rounded-lg">
                  <p className="text-xs text-base-content/60 uppercase tracking-wider mb-1">Genre</p>
                  <p className="font-semibold text-lg">{data?.data.genre}</p>
                </div>
                <div className="bg-base-300/50 p-4 rounded-lg">
                  <p className="text-xs text-base-content/60 uppercase tracking-wider mb-1">Screen</p>
                  <p className="font-semibold text-lg">{data?.data.screen}</p>
                </div>
                <div className="bg-base-300/50 p-4 rounded-lg">
                  <p className="text-xs text-base-content/60 uppercase tracking-wider mb-1">Show Date</p>
                  <p className="font-semibold text-lg">{data?.data.showDate}</p>
                </div>
                <div className="bg-base-300/50 p-4 rounded-lg">
                  <p className="text-xs text-base-content/60 uppercase tracking-wider mb-1">Show Time</p>
                  <p className="font-semibold text-lg">{data?.data.showTime}</p>
                </div>
              </div>

              {/* Seats - Highlighted */}
              <div className="bg-base-300/50 p-4 rounded-lg border-l-4 border-primary">
                <p className="text-xs text-base-content/60 uppercase tracking-wider mb-2">Your Seats</p>
                <div className="flex flex-wrap gap-2">
                  {data?.data.seats.map((seat: string, idx: number) => (
                    <span key={idx} className="badge badge-primary badge-lg font-mono">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Decorative Perforation Line */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-base-300"></div>
            </div>
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-base-100 rounded-full"></div>
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-base-100 rounded-full"></div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn btn-primary flex-1 gap-2"
            >
              {isDownloading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {isDownloading ? 'Downloading...' : 'Download Ticket'}
            </button>
            <button className="btn btn-outline btn-primary gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>

          {/* Important Notice */}
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm">Please arrive 15 minutes before showtime. Carry a valid ID for verification.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

