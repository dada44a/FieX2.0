import Table from '@/components/Table';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import React from 'react';
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

export const Route = createFileRoute('/protected/reports/')({
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
              disabled={isLoading || !startDate || !endDate} // Disable if loading or dates are missing
            >
              {isLoading ? 'Loading...' : 'Generate'}
            </button>
          </form>

          <h2 className="card-title mb-2">Reports</h2>
          {isError && <p className="text-error">Failed to load reports</p>}
        </div>
      </div>

      {/* Only display charts and table if data is available and not loading */}
      {reportData && !isLoading && (
      <div>
        <div className="card bg-base-200 card-md shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Revenue by Date (Line Chart)</h2>
            <Line
              // Key is not strictly necessary here, as useQuery's data change
              // is sufficient to trigger a re-render and chart update once
              // the components are registered. Using React.useMemo for data 
              // also helps performance.
              data={lineChartData}
            />
          </div>
        </div>

        <div className='flex mt-5 items-center gap-2'>
          <div className="card bg-base-200 card-md shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Bookings by Movie (Bar Chart)</h2>
              <Bar data={barChartData} />
            </div>
          </div>
          <div className="card bg-base-200 card-md shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Revenue by Screen (Pie Chart)</h2>
              <Pie data={pieChartData} />
            </div>
          </div>
        </div>

        <div className="card w-full max-w-4xl mt-5 bg-base-100 card-md shadow-sm">
            <div className="card-body">
            <h2 className="card-title">Ticket Details (Table)</h2>
            <Table data={reportData?.table || []} columns={columns} />
            </div>
        </div>
      </div>
      )}
      {/* Fallback for initial state or loading state when data is requested */}
      {isLoading && <p className='text-center'>Loading chart and table data...</p>}
      {!reportData && !isLoading && !isError && (
          <p className='text-center'>Select a date range and click "Generate" to view reports.</p>
      )}
    </div>
  );
}

export default RouteComponent;