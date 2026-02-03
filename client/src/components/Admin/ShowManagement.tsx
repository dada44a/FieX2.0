import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAddData, useEditData } from "@/hooks/useAddData";
import { LoadingTable } from "../loadingtable";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "../Table";

const BASE_URL = import.meta.env.VITE_API_LINK;

interface Show {
  id: number;
  movieId: number;
  screenId: number;
  showDate: string;
  showTime: string;
  adminEmail: string;
  movieTitle?: string;
  screenName?: string;
  screenPrice?: number;
}

const columnHelper = createColumnHelper<Show>();
const ShowManagement: React.FC = () => {

  const add = useAddData();
  const edit = useEditData();

  const [shows, setShows] = useState<Show[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState({
    movieId: "",
    screenId: "",
    showDate: "",
    showTime: "",
  });

  const [selectedRow, setSelectedRow] = useState<Show | null>(null);
  const [editData, setEditData] = useState({
    movieId: "",
    screenId: "",
    showDate: "",
    showTime: "",
  });

  const dialogRef = useRef<HTMLDialogElement>(null);

  // --- Fetch movies, screens, shows ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, screensRes, showsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/movies`),
          fetch(`${BASE_URL}/api/screens`),
          fetch(`${BASE_URL}/api/shows`),
        ]);

        if (!moviesRes.ok || !screensRes.ok || !showsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [moviesData, screensData, showsData] = await Promise.all([
          moviesRes.json(),
          screensRes.json(),
          showsRes.json(),
        ]);

        setMovies(Array.isArray(moviesData.data) ? moviesData.data : []);
        setScreens(Array.isArray(screensData.data) ? screensData.data : []);
        setShows(Array.isArray(showsData.data) ? showsData.data : []);
      } catch (err) {
        console.error(err);
        alert("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Add Show Handler ---
  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.movieId || !formValues.screenId) {
      alert("Please select movie and screen");
      return;
    }

    try {
      await add.mutateAsync({
        link: "/api/shows",
        datas: {
          movieId: Number(formValues.movieId),
          screenId: Number(formValues.screenId),
          showDate: formValues.showDate,
          showTime: formValues.showTime,
        },
        queryKey: ["shows"],
      });

      setFormValues({ movieId: "", screenId: "", showDate: "", showTime: "" });
      alert("Show added successfully!");
    } catch (err: any) {
      alert(`Error adding show: ${err.message}`);
    }
  };

  // --- Edit Modal Handlers ---
  const openDialog = (show: Show) => {
    setSelectedRow(show);
    setEditData({
      movieId: show.movieId.toString(),
      screenId: show.screenId.toString(),
      showDate: show.showDate,
      showTime: show.showTime,
    });
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    setSelectedRow(null);
  };

  const handleEdit = async () => {
    if (!selectedRow) return;

    try {
      await edit.mutateAsync({
        link: `/api/shows/${selectedRow.id}`,
        datas: {
          movieId: Number(editData.movieId),
          screenId: Number(editData.screenId),
          showDate: editData.showDate,
          showTime: editData.showTime,
        },
        queryKey: ["shows"],
      });
      alert("Show updated successfully!");
      closeDialog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    if (!confirm("Are you sure you want to delete this show?")) return;

    try {
      const res = await fetch(`${BASE_URL}/api/shows/${selectedRow.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete show");

      alert("Show deleted successfully!");
      closeDialog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor("movieTitle", {
      header: "Movie",
    }),
    columnHelper.accessor("screenName", {
      header: "Screen",
      cell: info => {
        const screen = screens.find(s => s.id === info.row.original.screenId);
        return (
          <>
            {info.getValue()} {screen?.price ? `(Rs ${screen.price})` : ""}
          </>
        );
      }
    }),
    columnHelper.accessor("showDate", {
      header: "Date",
    }),
    columnHelper.accessor("showTime", {
      header: "Time",
    }),
    columnHelper.display({
      id: "actions",
      header: "Action",
      cell: info => (
        <button
          onClick={() => openDialog(info.row.original)}
          className="btn btn-sm btn-neutral"
        >
          Edit
        </button>
      ),
    }),
  ], [screens]);

  if (loading) return <LoadingTable wantToShow={false} />;

  return (
    <div className="p-6 space-y-6">
      {/* Add Show Form */}
      <div className="p-5 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Add New Show</h2>
        <form onSubmit={handleAddShow} className="flex flex-wrap gap-4 items-center">
          <select
            value={formValues.movieId}
            onChange={(e) => setFormValues({ ...formValues, movieId: e.target.value })}
            className="select select-bordered"
          >
            <option value="">Select Movie</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          <select
            value={formValues.screenId}
            onChange={(e) => setFormValues({ ...formValues, screenId: e.target.value })}
            className="select select-bordered"
          >
            <option value="">Select Screen</option>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.price ? `(Rs ${s.price})` : ""}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={formValues.showDate}
            onChange={(e) => setFormValues({ ...formValues, showDate: e.target.value })}
            className="input input-bordered"
          />

          <input
            type="time"
            value={formValues.showTime}
            onChange={(e) => setFormValues({ ...formValues, showTime: e.target.value })}
            className="input input-bordered"
          />

          <button type="submit" className="btn btn-primary">
            Add Show
          </button>
        </form>
      </div>

      {/* Edit Modal */}
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box space-y-3">
          <h3 className="font-bold text-lg mb-2">Edit Show</h3>

          <div className="flex flex-col gap-3">
            <select
              className="select select-bordered"
              value={editData.movieId}
              onChange={(e) => setEditData({ ...editData, movieId: e.target.value })}
            >
              <option value="">Select Movie</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered"
              value={editData.screenId}
              onChange={(e) => setEditData({ ...editData, screenId: e.target.value })}
            >
              <option value="">Select Screen</option>
              {screens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.price ? `(Rs ${s.price})` : ""}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="input input-bordered"
              value={editData.showDate}
              onChange={(e) => setEditData({ ...editData, showDate: e.target.value })}
            />

            <input
              type="time"
              className="input input-bordered"
              value={editData.showTime}
              onChange={(e) => setEditData({ ...editData, showTime: e.target.value })}
            />
          </div>

          <div className="modal-action">
            <button className="btn btn-primary" onClick={handleEdit}>
              Update
            </button>
            <button className="btn btn-error" onClick={handleDelete}>
              Delete
            </button>
            <button className="btn btn-ghost" onClick={closeDialog}>
              Close
            </button>
          </div>
        </div>
      </dialog>
      <Table data={shows} columns={columns} />
    </div>
  );
};

export default ShowManagement;
