import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SeatSkeleton } from "@/routes/protected/movie/$movieid/payment.lazy";

type Seat = {
    id: number;
    showId: number;
    screenId: number;
    row: string; // A, B, C...
    column: number;
    isBooked: boolean;
};
type SeatObject = { row: string, column: number };



export default function SeatSelection({ showId, showListUpdate }: { showId: number, showListUpdate?: (action: "add" | "remove", item: SeatObject) => void }) {
    // ------------------ Fetch seats ------------------
    const { data, isLoading, error } = useQuery({
        queryKey: ["seats", showId],
        queryFn: async () => {
            const res = await axios.get(
                `http://localhost:4000/api/seats/${showId}`
            );
            return res.data.data as Seat[];
        },
    });

    // ------------------ Local state for toggling ------------------
    const [layout, setLayout] = useState<number[][]>([]);

    // Convert API data → 2D grid
    useEffect(() => {
        if (!data) return;

        // Find number of rows from letters (A, B, C...)
        const rows = Math.max(...data.map((s) => s.row.charCodeAt(0) - 65)) + 1;

        // Find max columns
        const cols = Math.max(...data.map((s) => s.column));

        // Build grid with default "0"
        const grid = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => 0)
        );

        // Fill booked seats (2)
        data.forEach((seat) => {
            const r = seat.row.charCodeAt(0) - 65;
            const c = seat.column - 1;
            grid[r][c] = seat.isBooked ? 2 : 0;
        });

        setLayout(grid);
    }, [data]);

    // ------------------ Seat toggle logic ------------------
    const toggleSeat = (row: number, col: number) => {
        setLayout((prev) => {
            const newSeats = prev.map((r) => [...r]);
            if (newSeats[row][col] === 0) newSeats[row][col] = 1;
            else if (newSeats[row][col] === 1) newSeats[row][col] = 0;
            return newSeats;
        });
    };

    // ------------------ Loading & Error ------------------
    if (isLoading) return <SeatSkeleton />;
    if (error) return <p>Failed to load seat data.</p>;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Select Your Seats</h2>

            <div className="grid gap-2 justify-center">
                {layout.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 justify-center">
                        {row.map((seat, colIndex) => {
                            const seatLabel = `${String.fromCharCode(65 + rowIndex)}-${colIndex + 1}`;
                            return (
                                <div
                                    key={colIndex}
                                    className={`w-10 h-10 rounded-md cursor-pointer flex items-center justify-center
                    ${seat === 0 ? "bg-accent hover:bg-green-500" : ""}
                    ${seat === 1 ? "bg-warning" : ""}
                    ${seat === 2 ? "bg-error cursor-not-allowed" : ""}
                  `}
                                    onClick={() => {
                                        if (seat === 2) return; // seat is booked

                                        const seatObj: SeatObject = {
                                            row: String.fromCharCode(65 + rowIndex),
                                            column: colIndex + 1,
                                        };

                                        if (seat === 0) {
                                            // Seat is becoming selected → ADD
                                            toggleSeat(rowIndex, colIndex);
                                            // showListUpdate is now correctly typed and used
                                            showListUpdate?.("add", seatObj);
                                        } else if (seat === 1) {
                                            // Seat is becoming unselected → REMOVE
                                            toggleSeat(rowIndex, colIndex);
                                            showListUpdate?.("remove", seatObj);
                                        }
                                    }}


                                    title={seatLabel}
                                >
                                    {seatLabel}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legends */}
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
    );
}
