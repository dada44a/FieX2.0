import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { createLazyFileRoute } from '@tanstack/react-router'
import React, { Suspense, useState, useMemo, useCallback } from 'react';

// --- PLACEHOLDER FOR USER HOOK ---
// Assume this hook provides the current authenticated user's details

// ---------------------------------

// Define the Seat type in the parent for state management and type safety
type Seat = {
  id: number;
  row: string;
  column: number;
  status: "AVAILABLE" | "SELECTED" | "BOOKED" | "RESERVED";
  booked_by: string | null;
  screenId: number;
  showId: number;
};

// Lazy load the SeatSelection component
const SeatSelection = React.lazy(() =>
  import('@/components/less_use/seat_selection').then(m => ({ default: m.default }))
);

export const Route = createLazyFileRoute('/protected/movie/$movieid/payment')({
  component: RouteComponent,
})

// ... (SeatSkeleton component remains the same) ...
export const SeatSkeleton: React.FC = React.memo(() => {
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex gap-5 justify-center'>
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
      </div>
      <div className='flex gap-5 justify-center'>
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
      </div>
      <div className='flex gap-5 justify-center'>
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
      </div>
      <div className='flex gap-5 justify-center'>
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
        <div className="skeleton w-[40px] h-[40px]" />
      </div>
    </div>
  );
})

// Define a placeholder price per ticket
const TICKET_PRICE = 300;

function RouteComponent() {
  const { movieid } = Route.useParams();
  const { user } = useUser(); // Get user information
  const userId = user?.id; // Extract the userId

  // State to hold the selected Seat objects received from the child
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isClearing, setIsClearing] = useState(false); // State for loading during clear

  // State for contact form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");


  const handleSeatChange = useCallback((seats: Seat[]) => {
    setSelectedSeats(seats);
    console.log("Parent received seat update:", seats.length, "seats selected.");
  }, []);



  const handleClearSelection = async () => {
    if (selectedSeats.length === 0) return;
    if (!userId) {
      alert("User ID not found. Cannot clear selection.");
      return;
    }

    const showId = Number(movieid);

    try {
      setIsClearing(true);

      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/seats/clear/${showId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }), // Send userId in the body
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedSeats([]);
        alert("Your seat selection has been cleared.");
      } else {
        alert(`Failed to clear seats: ${data.message || 'Unknown error'}`);
      }

    } catch (err) {
      console.error("Error clearing seats:", err);
      alert("Error contacting the server to clear seats.");
    } finally {
      setIsClearing(false);
    }
  };


  const totalAmountRs = selectedSeats.length * TICKET_PRICE;
  const totalAmountPaisa = totalAmountRs * 100;

  const seatLabels = useMemo(() => {
    return selectedSeats.map(s => `${s.row}${s.column}`).join(', ');
  }, [selectedSeats]);


  const { data: userData } = useQuery({
    queryKey: ['user-role', userId],
    queryFn: () => fetch(`${import.meta.env.VITE_API_LINK}/api/users/${userId}`).then(res => res.json()),
    enabled: !!userId,
  });

  const isAdminOrStaff = userData?.role === 'ADMIN' || userData?.role === 'STAFF';

  const handleReserve = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat before proceeding.");
      return;
    }

    if (!userId) {
      alert("User authentication error. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/seats/reserved`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(movieid),
          userId: userId,
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Seats reserved successfully. Waiting for admin approval.");
        setSelectedSeats([]);
      } else {
        alert(`Failed to reserve seats: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting server for reservation.");
    }
  };

  const handlepay = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat before proceeding.");
      return;
    }

    // Ensure contact fields are filled (basic check)
    if (!name || !phone) {
      alert("Please fill in your name and phone number.");
      return;
    }

    if (!userId) {
      alert("User authentication error. Please log in again.");
      return;
    }

    const body = {
      name,
      phone,
      amount: totalAmountPaisa,
      purchase_order_name: `Movie Tickets (${seatLabels})`,
      showId: Number(movieid),
      customerId: userId,
      // You might also want to send userId and the selected seat IDs for the payment process
    };

    try {
      // ... (Rest of the handlepay logic remains the same) ...
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        alert("Failed to initiate payment");
        console.log(data);
      }
      // ... (End of handlepay logic) ...

    } catch (err) {
      console.error(err);
      alert("Error contacting payment server");
    }
  };


  const isPaymentDisabled = selectedSeats.length === 0 || !name  || !phone || isClearing;

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-5xl w-full">

        <div className='p-4 rounded-lg shadow-inner'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-bold text-center'>Select Your Seats</h2>
            <div className='flex gap-2'>
              {isAdminOrStaff && (
                <button
                  className='btn btn-sm btn-secondary'
                  onClick={handleReserve}
                  disabled={selectedSeats.length === 0 || isClearing}
                >
                  Reserve
                </button>
              )}
              <button
                className='btn btn-sm btn-outline btn-warning'
                onClick={handleClearSelection}
                disabled={selectedSeats.length === 0 || isClearing}
              >
                {isClearing ? 'Clearing...' : 'Clear Selection'}
              </button>
            </div>
          </div>

          {/* Pass the callback prop to SeatSelection */}
          <Suspense fallback={<SeatSkeleton />}>
            <SeatSelection
              showId={Number(movieid)}
              onSeatSelectChange={handleSeatChange}
            />
          </Suspense>
        </div>


        {/* PAYMENT CARD AND SUMMARY */}
        <div className="w-full">
          {/* Summary Card */}
          <div className='mb-6 p-4  border border-blue-300 rounded-lg shadow-md'>
            <h3 className='text-lg font-semibold text-accent mb-2'>Selected Seats Summary</h3>
            <p className='text-gray-700'>
              Selected Seats: <span className="font-mono text-sm bg-blue-200 px-2 py-0.5 rounded">{seatLabels || 'None'}</span>
            </p>
            <p className='text-gray-700'>
              Total Tickets: <span className="font-bold text-blue-600">{selectedSeats.length}</span>
            </p>
            <p className='text-xl font-bold mt-2 text-primary'>
              Total Amount: Rs. {totalAmountRs.toFixed(2)}
            </p>
          </div>

          {/* Contact and Payment Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className='text-xl font-bold mb-4'>Contact Information</h3>

              {/* ... (Form fields for Name, Email, Phone remain the same) ... */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Name</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Type here"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Phone</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="98xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </fieldset>

              <button
                className="btn btn-primary mt-6"
                onClick={handlepay}
                disabled={isPaymentDisabled}
              >
                {isPaymentDisabled ? 'Select Seats & Fill Details' : `Pay Now (Rs. ${totalAmountRs.toFixed(2)})`}
              </button>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}