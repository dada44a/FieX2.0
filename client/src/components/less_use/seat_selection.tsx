import { useUser } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react"; // <-- Import useEffect

type Seat = {
  id: number;
  row: string;
  column: number;
  status: "AVAILABLE" | "SELECTED" | "BOOKED" | "RESERVED";
  booked_by: string | null;
  screenId: number;
  showId: number;
};

// Define props for the child component
type SeatSelectionProps = {
  showId: number;
  onSeatSelectChange: (selectedSeats: Seat[]) => void; // Callback prop
}

export default function SeatSelection({ showId, onSeatSelectChange }: SeatSelectionProps) { // <-- Update signature
  const { user } = useUser();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const [localSelection, setLocalSelection] = useState<Set<number>>(new Set());

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["seats", showId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/seats/${showId}`);
      const json = await res.json();
      return json.data as Seat[];
    },
    enabled: !!showId,
    refetchInterval: 100,
    refetchIntervalInBackground: true // refetch every 100ms for real-time updates
  });

  // [NEW] Fetch Show Details to check time
  const { data: showData, isLoading: isShowLoading } = useQuery({
    queryKey: ["show-details", showId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/shows/${showId}`);
      const json = await res.json();
      return json.show;
    },
    enabled: !!showId
  });

  // Determine if booking is closed
  const isBookingClosed = (() => {
    if (!showData) return false;
    const showDateTime = new Date(`${showData.showDate}T${showData.showTime}`);
    const now = new Date();
    return now > showDateTime;
  })();

  // Helper function to get the current selected seats
  const getCurrentUserSelectedSeats = (): Seat[] => {
    return data.filter(seat => {
      const isGloballySelectedByUser = seat.status === "SELECTED" && seat.booked_by === userId;
      // Also include seats that are AVAILABLE but in localSelection (pending server confirmation)
      const isLocallySelectedAndAvailable = localSelection.has(seat.id) && seat.status === "AVAILABLE";
      return isGloballySelectedByUser || isLocallySelectedAndAvailable;
    });
  };

  // Use useEffect to call the parent callback whenever data or localSelection changes
  useEffect(() => {
    if (!isLoading && !isError) {
      const currentSelected = getCurrentUserSelectedSeats();
      // Call the callback to pass the selected seats array to the parent
      onSeatSelectChange(currentSelected);
    }
  }, [data, localSelection, isLoading, isError, userId, onSeatSelectChange]); // Dependencies ensure it runs when state updates

  const toggleSeat = async (seat: Seat) => {
    // 1. Check if the seat is already SELECTED by the current user
    const isGloballySelectedByUser = seat.status === "SELECTED" && seat.booked_by === userId;

    // 2. Check if the seat is in the local, pending selection
    const isLocallySelected = localSelection.has(seat.id);

    // 3. Determine the action (SELECT or DESELECT)
    const isDeselect = isGloballySelectedByUser || isLocallySelected;

    // Deny selection if BOOKED or SELECTED by another user
    if (seat.status === "BOOKED" || (seat.status === "SELECTED" && seat.booked_by !== userId)) {
      return;
    }

    // Determine the API endpoint and HTTP method
    const method = isDeselect ? "DELETE" : "PUT";
    const endpoint = isDeselect ? 'release' : 'inactive';

    // Optimistically update local selection
    setLocalSelection((prev) => {
      const updated = new Set(prev);
      if (isDeselect) {
        updated.delete(seat.id);
      } else {
        updated.add(seat.id);
      }
      return updated;
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/seats/${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId, row: seat.row, column: seat.column, userId }),
      });
      const json = await res.json();

      if (res.ok && json.seat) {
        // Server succeeded: Update global seat state
        queryClient.setQueryData(["seats", showId], (old: Seat[] | undefined) =>
          old?.map((s) => (s.id === json.seat.id ? json.seat : s)) || [json.seat]
        );
        // Ensure local selection is cleared for this seat ID
        setLocalSelection((prev) => {
          const updated = new Set(prev);
          updated.delete(seat.id);
          return updated;
        });
      } else {
        // Server rejected: revert local optimistic state
        setLocalSelection((prev) => {
          const updated = new Set(prev);
          if (!isDeselect) {
            updated.delete(seat.id);
          } else {
            updated.add(seat.id);
          }
          return updated;
        });
      }
    } catch (err) {
      // Network error: revert local optimistic state
      setLocalSelection((prev) => {
        const updated = new Set(prev);
        if (!isDeselect) {
          updated.delete(seat.id);
        } else {
          updated.add(seat.id);
        }
        return updated;
      });
    }
  };

  if (isLoading) return <p>Loading seats...</p>;
  if (isError) return <p>Error loading seats</p>;
  if (!data.length) return <p>No seats found</p>;

  // Group seats by row
  const seatsByRow: Record<string, number> = {};
  data.forEach((seat) => {
    seatsByRow[seat.row] = Math.max(seatsByRow[seat.row] || 0, seat.column);
  });

  const rows = Object.keys(seatsByRow).sort();



  if (isShowLoading) return <div className="skeleton h-64 w-full"></div>;

  return (
    <div className="flex flex-col gap-2 relative">
      {/* Booking Closed Overlay */}
      {isBookingClosed && (
        <div className="absolute inset-0 bg-base-100/80 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="bg-error text-error-content px-6 py-4 rounded-xl shadow-2xl font-bold text-lg border border-error">
            Booking Closed
            <span className="block text-sm font-normal mt-1 opacity-90">This show has already started.</span>
          </div>
        </div>
      )}

      <div className="flex justify-center items-center h-4 w-full rounded-t-lg mb-4">Screen</div>
      {rows.map((row) => (
        <div key={row} className="flex gap-2 justify-center">
          {Array.from({ length: seatsByRow[row] }, (_, i) => {
            const colNum = i + 1;
            const seat = data.find((s) => s.row === row && s.column === colNum);

            // Seat must exist to be displayed
            if (!seat) return null;

            // Check if the seat is either in the local pending state OR globally selected by the current user
            const isPendingSelection = localSelection.has(seat.id);
            const isGloballySelectedByUser = seat.status === "SELECTED" && seat.booked_by === userId;
            const isUserSelected = isPendingSelection || isGloballySelectedByUser;


            const color =
              seat.status === "BOOKED"
                ? "bg-error cursor-not-allowed" // Booked by anyone
                : seat.status === "RESERVED"
                  ? "bg-secondary cursor-not-allowed"
                  : isUserSelected // Locally pending or globally selected by current user
                    ? "bg-accent hover:bg-blue-600 cursor-pointer"
                    : seat.status === "SELECTED" // Selected by another user
                      ? "bg-warning cursor-not-allowed"
                      : "bg-primary hover:bg-green-500 cursor-pointer"; // Available

            return (
              <div
                key={`${row}-${colNum}`}
                onClick={() => {
                  seat && seat.status !== "RESERVED" && toggleSeat(seat)
                }}
                className={`w-10 h-10 rounded-md flex items-center justify-center text-white font-semibold ${color}`}
              >
                {row}-{colNum}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary"></div>
          <p className="text-sm">Available</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-accent"></div>
          <p className="text-sm">Your Selection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-warning"></div>
          <p className="text-sm">Held by Others</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-error"></div>
          <p className="text-sm">Booked</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-secondary"></div>
          <p className="text-sm">Reserved</p>
        </div>
      </div>

    </div>
  );
}