import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ReservedSeats() {
    const queryClient = useQueryClient();

    const { data: reservedSeats, isLoading } = useQuery({
        queryKey: ["reserved-seats"],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/seats/reserved-list`);
            const json = await res.json();
            return json.data;
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (seatId: number) => {
            const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/seats/approve-reserved`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seatId }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reserved-seats"] });
            alert("Seat approved successfully!");
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async (seatId: number) => {
            const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/seats/reject-reserved`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seatId }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reserved-seats"] });
            alert("Seat rejected successfully!");
        },
    });

    if (isLoading) return <div className="p-4">Loading reserved seats...</div>;

    return (
        <div className="p-0">
            <h1 className="text-2xl font-bold mb-6">Reserved Seats Management</h1>

            <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Seat ID</th>
                            <th>Show ID</th>
                            <th>Row</th>
                            <th>Column</th>
                            <th>Reserved By</th>
                            <th>Reserved Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservedSeats?.map((seat: any) => (
                            <tr key={seat.id}>
                                <td>{seat.id}</td>
                                <td>{seat.showId}</td>
                                <td>{seat.row}</td>
                                <td>{seat.column}</td>
                                <td>{seat.booked_by}</td>
                                <td>{seat.bookedTime}</td>
                                <td className="flex gap-2">
                                    <button
                                        className="btn btn-sm btn-success text-white"
                                        onClick={() => approveMutation.mutate(seat.id)}
                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="btn btn-sm btn-error text-white"
                                        onClick={() => rejectMutation.mutate(seat.id)}
                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {reservedSeats?.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-4">No reserved seats found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
