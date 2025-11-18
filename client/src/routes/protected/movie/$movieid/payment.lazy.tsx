import { createLazyFileRoute } from '@tanstack/react-router'
import React, { Suspense, useState } from 'react';

const SeatSelection = React.lazy(() =>
  import('@/components/less_use/seat_selection').then(m => ({ default: m.default }))
);

export const Route = createLazyFileRoute('/protected/movie/$movieid/payment')({
  component: RouteComponent,
})

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

function RouteComponent() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { movieid } = Route.useParams();
  const [showlist, setShowlist] = useState<Set<string>>(new Set());

  const handlepay = async () => {
    const body = {
      name,
      email,
      phone,
      amount: 300,   // ✔ convert Rs 300 → 30000 paisa
      purchase_order_name: "Movie Ticket"
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.payment_url) {
        window.location.href = data.payment_url; // ✔ redirect works now
      } else {
        alert("Failed to initiate payment");
        console.log(data);
      }

    } catch (err) {
      console.error(err);
      alert("Error contacting payment server");
    }
  };

const addDataToShowList = (action: "add" | "remove", item: { row: string, column: number }) => {
  // Create a clean, unique key string (e.g., "A-1", "B-5")
  const key = `${item.row}-${item.column}`;

  setShowlist(prev => {
    // 1. Create a shallow copy of the previous Set
    const copy = new Set(prev);

    // 2. Add or delete the key string
    if (action === "add") copy.add(key);
    if (action === "remove") copy.delete(key);

    // 3. Return the new Set object for React to re-render
    return copy;
  });
};



  return (
    <div className="min-h-screen p-4 flex items-center justify-center">

      <p>Selected Seats: **{Array.from(showlist).join(', ')}**</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* SEAT LAYOUT */}
        <Suspense fallback={<SeatSkeleton />}>
          <SeatSelection showId={Number(movieid)} showListUpdate={addDataToShowList} />
        </Suspense>

        {/* PAYMENT CARD */}
        <div className="card bg-base-100 w-96 shadow-sm">
          <div className="card-body">

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Name</legend>
              <input
                type="text"
                className="input"
                placeholder="Type here"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email</legend>
              <input
                type="email"
                className="input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Phone</legend>
              <input
                type="text"
                className="input"
                placeholder="98xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </fieldset>

            <button
              className="btn btn-primary mt-3"
              onClick={handlepay}
            >
              Buy Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
