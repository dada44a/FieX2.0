import { LoadingTable } from '@/components/loadingtable';
import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import Table from '@/components/Table';
import UserProfileComponent from '@/components/less_use/user_profile';
import { useUser } from '@clerk/clerk-react';


export const Route = createLazyFileRoute('/protected/user/profile/')({
  component: RouteComponent,
});

interface Ticket {
  id: number;
  movie: string;
  genre: string;
  screen: string;
  showTime: string;
  showDate: string;
  seats: string[];
}

const columnHelper = createColumnHelper<Ticket>();

function RouteComponent() {
  const { user } = useUser();
  const { data, isLoading, error } = useQuery<Ticket[]>({
    queryKey: ['userTickets'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/tickets/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const json = await res.json();
      return json.data || [];
    },
  });

  const column = React.useMemo(
    () => [
      columnHelper.accessor('movie', { header: 'Name' }),
      columnHelper.accessor('screen', { header: 'Screen' }),
      columnHelper.accessor('showTime', { header: 'Show Time' }),
      columnHelper.accessor('showDate', { header: 'Show Date' }),
      columnHelper.accessor('seats', { header: 'Seats', cell: info => info.getValue().join(', ') }),
      columnHelper.display({
        id: 'action', header: 'Action', cell: info => (
          <Link
            to="/protected/user/profile/$ticketid"
            params={{ ticketid:info.row.original.id.toString() }}
            className="btn btn-sm btn-primary"
          >
            details
          </Link>

        )
      }),
    ],
    []
  );

  if (isLoading) return <div className="min-h-screen p-4 flex flex-col gap-6">
    <Suspense fallback={<div>Loading profile...</div>}>
      <UserProfileComponent />
    </Suspense>
    <LoadingTable wantToShow={false} />
  </div>;

  if (error) return <div className="min-h-screen p-4 flex flex-col gap-6">
    <Suspense fallback={<div>Loading profile...</div>}>
      <UserProfileComponent />
    </Suspense>
    <div>Error loading tickets: {(error as Error).message}</div>;
  </div>;

  return (
    <div className="min-h-screen p-4 flex flex-col gap-6">
      <Suspense fallback={<div>Loading profile...</div>}>
        <UserProfileComponent />
      </Suspense>

      <Table<Ticket> data={data || []} columns={column} />
    </div>
  );
}
