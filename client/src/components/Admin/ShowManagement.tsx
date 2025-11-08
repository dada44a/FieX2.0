import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useAddData, useEditData } from "@/hooks/useAddData";
import { useQuery } from "@tanstack/react-query";
import { LoadingTable } from "../loadingtable";


const BASE_URL = "http://localhost:4000";


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

const ShowManagement: React.FC = () => {
  const add = useAddData();
  const edit = useEditData();
  const [selectedRow, setSelectedRow] = useState<Show | null>(null);

  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [editData, setEditData] = useState({
    movieId: "",
    screenId: "",
    showDate: "",
    showTime: "",
  });

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['movies', 'screens'],
    queryFn: async () => {
      const [moviesRes, screensRes] = await Promise.all([
        fetch(`${BASE_URL}/api/movies`),
        fetch(`${BASE_URL}/api/screens`),
      ]);

      if (!moviesRes.ok) throw new Error('Failed to fetch movies');
      if (!screensRes.ok) throw new Error('Failed to fetch screens');

      const [moviesData, screensData] = await Promise.all([
        moviesRes.json(),
        screensRes.json(),
      ]);
      return {
        movies: Array.isArray(moviesData.data) ? moviesData.data : [],
        screens: Array.isArray(screensData.data) ? screensData.data : [],
      };
    },
  });

  const { data: showsData, isLoading: isLoadingShows } = useQuery({
    queryKey: ['shows'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/shows`);
      if (!res.ok) throw new Error('Failed to fetch shows');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const movies = data?.movies ?? [];
  const screens = data?.screens ?? [];
  const shows = showsData ?? [];

  // --- Add Show Form ---
  const form = useForm({
    defaultValues: {
      movieId: "",
      screenId: "",
      showDate: "",
      showTime: "",
    },
    onSubmit: (values) => {
      add.mutateAsync(
        {
          link: "/api/shows",
          datas: {
            movieId: Number(values.value.movieId),
            screenId: Number(values.value.screenId),
            showDate: values.value.showDate,
            showTime: values.value.showTime,
          },
          queryKey: ['shows'],
        },
        {
          onSuccess: async () => {
            form.reset();
            alert("Show added successfully!");
          },
          onError: (error: any) => {
            alert(`Error adding show: ${error.message}`);
          },
        }
      );
    },
  });

  // --- Modal Handlers ---
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

    await edit.mutateAsync({
      link: `/api/shows/${selectedRow.id}`,
      datas: {
        movieId: Number(editData.movieId),
        screenId: Number(editData.screenId),
        showDate: editData.showDate,
        showTime: editData.showTime,
      },
      queryKey: ['shows'],
    });
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

  if (isLoading) {

    return (
      <>
        {/* Add Show Form */}
        < div className="p-5 shadow-sm" >
          <form onSubmit={form.handleSubmit} className="space-y-4">
            <h2 className="font-bold text-lg">Add New Show</h2>
            <div className="flex flex-wrap gap-4 items-center">
              {/* Movie */}
              <form.Field name="movieId">
                {(field) => (
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="select select-bordered"
                  >
                    <option value="">Select Movie</option>
                    {movies.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                )}
              </form.Field>

              {/* Screen */}
              <form.Field name="screenId">
                {(field) => (
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="select select-bordered"
                  >
                    <option value="">Select Screen</option>
                    {screens.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.price ? `(Rs ${s.price})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </form.Field>

              {/* Date */}
              <form.Field name="showDate">
                {(field) => (
                  <input
                    type="date"
                    className="input input-bordered"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>

              {/* Time */}
              <form.Field name="showTime">
                {(field) => (
                  <input
                    type="time"
                    className="input input-bordered"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>

              <button type="submit" className="btn btn-primary">
                Add Show
              </button>
            </div>
          </form>
        </div >
        <LoadingTable wantToShow={false} />
      </>
    )
  }

  return (
    <>
      {/* Edit Modal */}
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box space-y-3">
          <h3 className="font-bold text-lg mb-2">Edit Show</h3>

          <div className="flex flex-col gap-3">
            <select
              className="select select-bordered"
              value={editData.movieId}
              onChange={(e) =>
                setEditData({ ...editData, movieId: e.target.value })
              }
            >
              <option value="">Select Movie</option>
              {movies.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered"
              value={editData.screenId}
              onChange={(e) =>
                setEditData({ ...editData, screenId: e.target.value })
              }
            >
              <option value="">Select Screen</option>
              {screens.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.price ? `(Rs ${s.price})` : ""}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="input input-bordered"
              value={editData.showDate}
              onChange={(e) =>
                setEditData({ ...editData, showDate: e.target.value })
              }
            />

            <input
              type="time"
              className="input input-bordered"
              value={editData.showTime}
              onChange={(e) =>
                setEditData({ ...editData, showTime: e.target.value })
              }
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

      {/* Main Page */}
      <div className="p-6 space-y-6">
        {/* Add Show Form */}
        <div className="p-5 shadow-sm">
          <form onSubmit={form.handleSubmit} className="space-y-4">
            <h2 className="font-bold text-lg">Add New Show</h2>
            <div className="flex flex-wrap gap-4 items-center">
              {/* Movie */}
              <form.Field name="movieId">
                {(field) => (
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="select select-bordered"
                  >
                    <option value="">Select Movie</option>
                    {movies.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                )}
              </form.Field>

              {/* Screen */}
              <form.Field name="screenId">
                {(field) => (
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="select select-bordered"
                  >
                    <option value="">Select Screen</option>
                    {screens.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.price ? `(Rs ${s.price})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </form.Field>

              {/* Date */}
              <form.Field name="showDate">
                {(field) => (
                  <input
                    type="date"
                    className="input input-bordered"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>

              {/* Time */}
              <form.Field name="showTime">
                {(field) => (
                  <input
                    type="time"
                    className="input input-bordered"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>

              <button type="submit" className="btn btn-primary">
                Add Show
              </button>
            </div>
          </form>
        </div>

        {/* Shows Table */}
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="">
              <tr>
                <th>Movie</th>
                <th>Screen</th>
                <th>Date</th>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingShows ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) :  shows.length === 0? (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    {isError || `No shows available. or ${error}`}
                  </td>
                </tr>
              ) : (
                shows.map((show: any) => (
                  <tr key={show.id}>
                    <td>{show.movieTitle || "—"}</td>
                    <td>
                      {show.screenName}{" "}
                      {show.screenPrice ? `(Rs ${show.screenPrice})` : ""}
                    </td>
                    <td>{show.showDate}</td>
                    <td>{show.showTime}</td>
                    <td>{show.adminEmail || "—"}</td>
                    <td className="flex gap-2">
                      <button
                        onClick={() => openDialog(show)}
                        className="btn btn-sm btn-neutral"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ShowManagement;
