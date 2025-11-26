import Table from '@/components/Table';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import React from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
export const Route = createFileRoute('/protected/admin/reports/')({
  component: RouteComponent,
});

interface ReportRow {
  ticketId: number;
  customerId: string;
  mobile: string;
  movieTitle: string;
  screenName: string;
  seatRow: string;
  seatColumn: number;
  price: number;
  bookedDate: string;
}

const columnHelper = createColumnHelper<ReportRow>();

function RouteComponent() {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const { data: reportData, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', startDate, endDate],
    queryFn: async (): Promise<any> => {
      const res = await fetch(
        `http://localhost:4000/api/reports/reports?start=${startDate}&end=${endDate}`
      );
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
    enabled: false, // Disabled initially, only fetch when user clicks "Generate"
  });

  const columns = React.useMemo(
    () => [
      columnHelper.accessor('ticketId', { header: 'Ticket ID' }),
      columnHelper.accessor('customerId', { header: 'Customer ID' }),
      columnHelper.accessor('mobile', { header: 'Mobile' }),
      columnHelper.accessor('movieTitle', { header: 'Movie Title' }),
      columnHelper.accessor('screenName', { header: 'Screen Name' }),
      columnHelper.accessor('seatRow', { header: 'Seat Row' }),
      columnHelper.accessor('seatColumn', { header: 'Seat Column' }),
      columnHelper.accessor('price', { header: 'Price' }),
      columnHelper.accessor('bookedDate', { header: 'Booked Date' }),
    ],
    []
  );

  const handleGenerateReport = () => {
    refetch();
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-5 gap-6">
      <div className="card bg-base-300 w-full max-w-4xl shadow-sm">
        <div className="card-body">
          <form className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label htmlFor="start">Start</label>
              <input
                type="date"
                name="start"
                className="input input-bordered"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="end">End</label>
              <input
                type="date"
                name="end"
                className="input input-bordered"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerateReport}
            >
              Generate
            </button>
          </form>

          <h2 className="card-title mb-2">Reports</h2>
          {isLoading && <p>Loading...</p>}
          {isError && <p className="text-error">Failed to load reports</p>}
        </div>
      </div>

      <div>
        <div className="card bg-base-200 card-md shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Medium Card</h2>
            <Line
              data={
                {
                  labels: reportData?.lineGraph.map((item: any) => item.date) || [],
                  datasets: [
                    {
                      label: 'Revenue by Date',
                      data: reportData?.lineGraph.map((item: any) => item.revenue) || [],

                    },
                  ],
                }
              }
            />

          </div>
        </div>



        <div className='flex mt-5 items-center gap-2'>
          <div className="card bg-base-200 card-md shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Bar Chart</h2>
              <Bar
                data={
                  {
                    labels: reportData?.barGraph.map((item: any) => item.movieTitle) || [],
                    datasets: [
                      {
                        label: 'Bookings by Movie',
                        data: reportData?.barGraph.map((item: any) => item.bookings) || [],

                      },
                    ],
                  }
                }
              />
            </div>
          </div>
          <div className="card bg-base-200 card-md shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Pie Chart</h2>
              <Pie
                data={
                  {
                    labels: reportData?.pieChart.map((item: any) => item.screenName) || [],
                    datasets: [
                      {
                        label: 'Revenue by Screen',
                        data: reportData?.pieChart.map((item: any) => item.revenue) || [],

                      },
                    ],
                  }
                }
              />

            </div>
          </div>
        </div>



      </div>

      <div className="card w-180 bg-base-100 card-md shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Table</h2>
          <Table data={reportData?.table || []} columns={columns} />
        </div>
      </div>
      <div className="w-full max-w-6xl">
        
      </div>


    </div>
  );
}

export default RouteComponent;
