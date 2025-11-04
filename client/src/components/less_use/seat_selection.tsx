import { useState } from "react";


export default function SeatSelection() {
      // Example seat layout: 5 rows x 8 columns
  const rows = 5;
  const cols = 8;

  // Seat states: 0 = available, 1 = selected, 2 = booked
  const [seats, setSeats] = useState(
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 0)
    )
  );

  const toggleSeat = (row: number, col: number) => {
    setSeats(prev => {
      const newSeats = prev.map(r => [...r]);
      if (newSeats[row][col] === 0) newSeats[row][col] = 1;
      else if (newSeats[row][col] === 1) newSeats[row][col] = 0;
      return newSeats;
    });
  };

    return (
        <>
            {/* Seat Selection */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Select Your Seats</h2>
                <div className="grid gap-2 justify-center">
                    {seats.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-2 justify-center">
                            {row.map((seat, colIndex) => (
                                <div
                                    key={colIndex}
                                    className={`w-10 h-10 rounded-md cursor-pointer flex items-center justify-center
                    ${seat === 0 ? 'bg-accent hover:bg-green-500' : ''}
                    ${seat === 1 ? 'bg-warning ' : ''}
                    ${seat === 2 ? 'bg-error cursor-not-allowed' : ''}
                  `}
                                    onClick={() => seat !== 2 && toggleSeat(rowIndex, colIndex)}
                                    title={`Row ${rowIndex + 1} Seat ${colIndex + 1}`}
                                >
                                    {rowIndex + 1}-{colIndex + 1}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Seat Legend */}
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-accent rounded-sm"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-warning rounded-sm"></div>
                        <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-error rounded-sm"></div>
                        <span>Booked</span>
                    </div>
                </div>
            </div>
        </>

    )
}
