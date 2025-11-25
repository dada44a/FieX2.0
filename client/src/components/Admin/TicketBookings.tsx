import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import Table from "../Table";
import { LoadingTable } from "../loadingtable";

const BASE_URL = "http://localhost:4000/api/tickets";

type Ticket = {
  id: number;
  customer: string;
  movie: string;
  show: number;
  paymentDate: string;
  transactionId: string;
  pidx: string;
  screen: string;
  showTime: string;
  showDate: string;
  genre: string;
};


const TicketBookings = () => {

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await axios.get(BASE_URL);
      return res.data?.data || [];
    },
  });


  const columnHelper = createColumnHelper<Ticket>();

  const columns = useMemo(() => [
    columnHelper.accessor('id', { header: 'ID' }),
    columnHelper.accessor('customer', {
      header: 'Customer'
    }),
    columnHelper.accessor('movie', {
      header: 'Movie'
    }),
    columnHelper.accessor('paymentDate', {
      header: 'Date/Time'
    }),
    columnHelper.accessor('transactionId', {
      header: 'Transation Id'
    }),
    columnHelper.accessor('pidx', {
      header: 'pidx'
    }),
    columnHelper.accessor('show', {
      header: 'Show'
    }),
    columnHelper.accessor('genre', {
      header: 'Genre'
    }),
    columnHelper.accessor('screen', {
      header: 'Screen'
    }),
    columnHelper.accessor('showTime', {
      header: 'Show Time'
    }),
    columnHelper.accessor('showDate', {
      header: 'Show Date'
    }),
    columnHelper.display(
      {
        id: 'status',
        header: 'Status',
        cell: () => <span className="badge badge-success">Paid</span>
      }
    )

  ], [])

  if (isLoading) {
    return <LoadingTable wantToShow={false} />;
  }


  if (isError) {
    return <div className="text-error">Error fetching tickets.</div>;
  }

  return (
    <>
      <Table <Ticket> data={data || []} columns={columns} />

    </>
  );
};

export default TicketBookings;

