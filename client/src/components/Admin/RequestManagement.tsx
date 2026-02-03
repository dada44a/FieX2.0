
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type MovieRequest = {
    id: number;
    movieTitle: string;
    description: string;
    userId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
};

const RequestManagement = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["movie-requests"],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/requests`);
            if (!res.ok) throw new Error("Failed to fetch requests");
            return res.json();
        },
    });

    const { mutate: updateStatus } = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/requests/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["movie-requests"] });
        },
    });

    if (isLoading) return <div className="skeleton h-64 w-full"></div>;
    if (error) return <div className="text-error">Error: {(error as Error).message}</div>;

    const requests: MovieRequest[] = data?.data || [];

    return (
        <div className="overflow-x-auto bg-base-100 rounded-lg shadow-sm border border-base-200">
            <table className="table w-full">
                <thead className="bg-base-200">
                    <tr>
                        <th>ID</th>
                        <th>Movie Title</th>
                        <th>Description</th>
                        <th>Requested At</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center py-8 opacity-60">No requests found.</td>
                        </tr>
                    ) : (
                        requests.map((req) => (
                            <tr key={req.id} className="hover">
                                <th>{req.id}</th>
                                <td className="font-bold">{req.movieTitle}</td>
                                <td className="max-w-xs truncate" title={req.description}>{req.description || '-'}</td>
                                <td>{req.createdAt ? new Date(req.createdAt).toDateString() : '-'}</td>
                                <td>
                                    <div className={`badge ${req.status === 'APPROVED' ? 'badge-success text-white' :
                                        req.status === 'REJECTED' ? 'badge-error text-white' :
                                            'badge-warning'
                                        }`}>
                                        {req.status}
                                    </div>
                                </td>
                                <td className="flex gap-2">
                                    {req.status === 'PENDING' && (
                                        <>
                                            <button
                                                className="btn btn-xs btn-success text-white"
                                                onClick={() => updateStatus({ id: req.id, status: 'APPROVED' })}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-xs btn-error text-white"
                                                onClick={() => updateStatus({ id: req.id, status: 'REJECTED' })}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {req.status !== 'PENDING' && (
                                        <span className="text-xs opacity-50">Locked</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default RequestManagement;
