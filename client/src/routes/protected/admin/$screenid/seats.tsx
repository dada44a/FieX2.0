import { LoadingTable } from '@/components/loadingtable';
import { useAddData, useDeleteData, useEditData } from '@/hooks/useAddData';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useRef, useState } from 'react';

interface Seat {
  id?: number;
  row: string;
  column: number;
}

export const Route = createFileRoute('/protected/admin/$screenid/seats')({
  component: RouteComponent,
});

function RouteComponent() {
  const addData = useAddData();
  const removeData = useDeleteData();
  const editData = useEditData();
  const screenId = useParams({
    from: '/protected/admin/$screenid/seats',
    select: (params) => params.screenid,
  });

  const [editState, setEditState] = useState('');
  const [seats, setSeats] = useState('');
  const [selectedRow, setSelectedRow] = useState<Seat | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seats', screenId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:4000/api/seats/${screenId}`);
      if (!res.ok) throw new Error('Failed to fetch seats');
      const json = await res.json();
      return json.data;
    },
    enabled: !!screenId,
  });

  const openDialog = (seat: Seat) => {
    setSelectedRow(seat);
    setEditState(JSON.stringify({ row: seat.row, column: seat.column }));
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    setSelectedRow(null);
  };

  const handleSave = async () => {
    try {
      let fixedStr = seats.replace(/'/g, '"').replace(/(\w+)\s*:/g, '"$1":');
      const seatData: Seat[] = JSON.parse(fixedStr);

      await addData.mutateAsync({
        link: `/api/seats/${screenId}`,
        datas: seatData,
        queryKey: ['seats'],
      });

      alert('Seats added successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save seats — check JSON format.');
    }
  };

  const handleDelete = async (seat: any) => {
    try {
      await removeData.mutateAsync({
        link: `/api/seats/${seat.id}`,
        queryKey: ['seats'],
      });
      alert(`Seat ${seat.row} deleted successfully!`);
      closeDialog();
    } catch (err) {
      console.error(err);
      alert('Failed to delete seat');
    }
  };

  const handleEdit = async (seat: any) => {
    try {
      let fixedStr = editState.replace(/'/g, '"').replace(/(\w+)\s*:/g, '"$1":');
      const seatData: Seat = JSON.parse(fixedStr);

      await editData.mutateAsync({
        link: `/api/seats/${seat.id}`,
        datas: seatData,
        queryKey: ['seats'],
      });

      alert(`Seat ${seat.row} updated successfully!`);
      closeDialog();
    } catch (err) {
      console.error(err);
      alert('Failed to update seat — check JSON format.');
    }
  };

  // --- Loading skeleton ---
  if (isLoading)
    return (
     <LoadingTable />
    );

  // --- Error state ---
  if (isError)
    return (
      <div className="p-10">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Seat JSON</legend>
          <textarea
            className="textarea h-24"
            placeholder="[
  { row: 'A', column: 10 },
  { row: 'B', column: 10 }
]"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
          ></textarea>
        </fieldset>
        <div className="my-5">
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
        <div>Error: Empty Database or {error.message}</div>
      </div>
    );

  // --- Main Render ---
  return (
    <>
      {/* Modal */}
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Seat Details</h3>
          {selectedRow && (
            <div className="flex gap-2 mt-5">
              <input
                type="text"
                placeholder="{ 'row': 'A', 'column': 10 }"
                className="input input-primary w-full"
                value={editState}
                onChange={(e) => setEditState(e.target.value)}
              />
            </div>
          )}
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={() => selectedRow && handleEdit(selectedRow)}
            >
              Update
            </button>
            <button
              className="btn btn-error"
              onClick={() => selectedRow && handleDelete(selectedRow)}
            >
              Delete
            </button>
            <button className="btn btn-ghost" onClick={closeDialog}>
              Close
            </button>
          </div>
        </div>
      </dialog>

      {/* Add Seats */}
      <fieldset className="fieldset p-10">
        <legend className="fieldset-legend">Seat JSON</legend>
        <textarea
          className="textarea h-24"
          placeholder="[
  { row: 'A', column: 10 },
  { row: 'B', column: 10 }
]"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
        ></textarea>
      </fieldset>

      <div className="my-5">
        <button className="btn btn-primary ml-10" onClick={handleSave}>
          Save
        </button>
      </div>

      {/* Seat Table */}
      <div className="overflow-x-auto p-10">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Row</th>
              <th>Column</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((seat: any) => (
                <tr key={seat.id}>
                  <td>{seat.id}</td>
                  <td>{seat.row}</td>
                  <td>{seat.column}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => openDialog(seat)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-2">
                  No seats found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
