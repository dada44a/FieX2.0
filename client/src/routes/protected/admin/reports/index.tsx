import Table from '@/components/Table';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import React from 'react';
import Card from '@/components/Card'; // Import Card component
// Import and register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement, // Required for Pie Chart
  PointElement, // Required for Line Chart
  LineElement, // Required for Line Chart
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// --- IMPORTANT FIX: Register Chart.js components ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);
// ---------------------------------------------------

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
    // The key prop on the charts is sufficient for a re-render when reportData changes,
    // but the primary issue is Chart.js registration. We'll keep 'enabled: false'
    // to match the original logic of only fetching on 'Generate' click.
    enabled: false,
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
    // Only refetch if both dates are selected
    if (startDate && endDate) {
      refetch();
    } else {
      // Optional: Add some user feedback if dates are missing
      console.warn('Please select both start and end dates.');
    }
  };

  // Helper to extract line chart data safely
  const lineChartData = React.useMemo(() => {
    const data = reportData?.lineGraph || [];
    return {
      labels: data.map((item: any) => item.date) || [],
      datasets: [
        {
          label: 'Revenue by Date',
          data: data.map((item: any) => item.revenue) || [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    };
  }, [reportData]);

  // Helper to extract bar chart data safely
  const barChartData = React.useMemo(() => {
    const data = reportData?.barGraph || [];
    return {
      labels: data.map((item: any) => item.movieTitle) || [],
      datasets: [
        {
          label: 'Bookings by Movie',
          data: data.map((item: any) => item.bookings) || [],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  }, [reportData]);

  // Helper to extract pie chart data safely
  const pieChartData = React.useMemo(() => {
    const data = reportData?.pieChart || [];
    // You might want to use a color palette for Pie charts
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
    ];

    return {
      labels: data.map((item: any) => item.screenName) || [],
      datasets: [
        {
          label: 'Revenue by Screen',
          data: data.map((item: any) => item.revenue) || [],
          backgroundColor: data.map((_: any, index: number) => backgroundColors[index % backgroundColors.length]),
          borderWidth: 1,
        },
      ],
    };
  }, [reportData]);

  return (
    <main className="min-h-screen py-8 px-8">
      <div className="cineverse-container">
        <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>

        <Card title="Generate Report">
          <form className="flex flex-wrap items-end gap-4">
            <div className="form-control w-full max-w-xs">
              <label className="label" htmlFor="start">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                name="start"
                className="input input-bordered w-full max-w-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-control w-full max-w-xs">
              <label className="label" htmlFor="end">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                name="end"
                className="input input-bordered w-full max-w-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerateReport}
              disabled={isLoading || !startDate || !endDate}
            >
              {isLoading ? 'Loading...' : 'Generate'}
            </button>
          </form>
          {isError && <p className="text-error mt-2">Failed to load reports</p>}
        </Card>

        {/* Only display charts and table if data is available and not loading */}
        {reportData && !isLoading && (
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Revenue by Date (Line Chart)">
                <div className="h-64 sm:h-80 w-full flex items-center justify-center">
                  <Line
                    data={lineChartData}
                    options={{ maintainAspectRatio: false }}
                  />
                </div>
              </Card>
              <div className="grid grid-cols-1 gap-6">
                <Card title="Bookings by Movie (Bar Chart)">
                  <div className="h-64 w-full flex items-center justify-center">
                    <Bar
                      data={barChartData}
                      options={{ maintainAspectRatio: false }}
                    />
                  </div>
                </Card>
                <Card title="Revenue by Screen (Pie Chart)">
                  <div className="h-64 w-full flex items-center justify-center">
                    <Pie
                      data={pieChartData}
                      options={{ maintainAspectRatio: false }}
                    />
                  </div>
                </Card>
              </div>
            </div>

            <Card title="Ticket Details">
              <Table data={reportData?.table || []} columns={columns} />
            </Card>
          </div>
        )}

        {/* Fallback for initial state or loading state when data is requested */}
        {isLoading && <div className="mt-10 flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>}
        {!reportData && !isLoading && !isError && (
          <div className="mt-10 text-center opacity-50">
            <p>Select a date range and click "Generate" to view reports.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default RouteComponent;