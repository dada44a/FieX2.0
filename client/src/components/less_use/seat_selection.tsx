import React from "react";
import { useQuery } from "@tanstack/react-query";

type Seat = {
  id: number;
  row: string;
  column: number;
  isBooked: boolean;
  screenId: number;
};

export default function SeatSelection({ showId }: { showId: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["seats", showId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:4000/api/seats/screen/${showId}`);
      const json = await res.json();
      return json.data as Seat[];
    },
    enabled: !!showId,
  });

  if (isLoading) return <p>Loading seats...</p>;
  if (isError) return <p>Error loading seats</p>;
  if (!data || data.length === 0) return <p>No seats found for this show</p>;

  // Group seats by row and find total columns for that row
  const seatsByRow: Record<string, number> = {};
  data.forEach((seat) => {
    if (!seatsByRow[seat.row] || seatsByRow[seat.row] < seat.column) {
      seatsByRow[seat.row] = seat.column; // store max column number for that row
    }
  });

  const rows = Object.keys(seatsByRow).sort();

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row} className="flex gap-2">
          {Array.from({ length: seatsByRow[row] }, (_, i) => {
            const colNum = i + 1;
            // find the seat object for this row & column to check booked
            const seat = data.find((s) => s.row === row && s.column === colNum);
            const isBooked = seat?.isBooked ?? false;

            return (
              <div
                key={`${row}-${colNum}`}
                className={`w-10 h-10 rounded-md flex items-center justify-center ${
                  isBooked ? "bg-red-500 cursor-not-allowed" : "bg-green-400 hover:bg-green-500"
                } text-white font-semibold`}
              >
                {row}-{colNum}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
