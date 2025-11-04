import React, { useEffect, useState } from "react";

const BASE_URL = "http://localhost:8080";

interface Movie {
  id: number;
  title: string;
}

interface Screen {
  id: number;
  name: string;
  price: number;
}

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
  const [shows, setShows] = useState<Show[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [formData, setFormData] = useState<{
    movieId: string;
    screenId: string;
    showDate: string;
    showTime: string;
    adminEmail: string;
  }>({
    movieId: "",
    screenId: "",
    showDate: "",
    showTime: "",
    adminEmail: "",
  });

  /** ---------- Fetch Movies & Screens ---------- */
  useEffect(() => {
    fetchMovies();
    fetchScreens();
  }, []);

  useEffect(() => {
    if (movies.length > 0 && screens.length > 0) {
      fetchShows();
    }
  }, [movies, screens]);

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/movie`);
      const data: Movie[] = await res.json();
      setMovies(data);
    } catch (err) {
      console.error("Error fetching movies:", err);
    }
  };

  const fetchScreens = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/screen`);
      const data: Screen[] = await res.json();
      setScreens(data);
    } catch (err) {
      console.error("Error fetching screens:", err);
    }
  };

  const fetchShows = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/show`);
      const data: Show[] = await res.json();

      // Enrich shows with movieTitle and screen info
      const enrichedShows = data.map((show) => {
        const movie = movies.find((m) => m.id === Number(show.movieId));
        const screen = screens.find((s) => s.id === Number(show.screenId));

        return {
          ...show,
          movieTitle: movie?.title || "N/A",
          screenName: screen?.name || "N/A",
          screenPrice: screen?.price || 0,
        };
      });

      setShows(enrichedShows);
    } catch (err) {
      console.error("Error fetching shows:", err);
    }
  };

  /** ---------- Form Handlers ---------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addShow = async () => {
    const { movieId, screenId, showDate, showTime, adminEmail } = formData;
    if (!movieId || !screenId || !showDate || !showTime || !adminEmail) {
      alert("Please fill all fields");
      return;
    }

    const formattedTime = showTime.length === 5 ? `${showTime}:00` : showTime;

    try {
      await fetch(`${BASE_URL}/api/show`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          movieId: Number(movieId),
          screenId: Number(screenId),
          showDate,
          showTime: formattedTime,
          adminEmail,
        }),
      });

      setFormData({ movieId: "", screenId: "", showDate: "", showTime: "", adminEmail: "" });
      fetchShows();
    } catch (err) {
      console.error("Error adding show:", err);
    }
  };

  const deleteShow = async (id: number) => {
    if (!window.confirm("Delete this show?")) return;
    try {
      await fetch(`${BASE_URL}/api/show/${id}`, { method: "DELETE" });
      fetchShows();
    } catch (err) {
      console.error("Error deleting show:", err);
    }
  };

  /** ---------- Render ---------- */
  return (
    <div className="p-6">
      {/* Add Show Form */}
      <div className="mb-6 p-4 shadow-sm">
        <h2 className="font-bold mb-4 text-lg">Add New Show</h2>
        <div className="flex gap-3 flex-wrap">
          {/* Movie select */}
          <select
            name="movieId"
            value={formData.movieId}
            onChange={handleInputChange}
            className="select select-bordered"
          >
            <option value="">Select Movie</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          {/* Screen select */}
          <select
            name="screenId"
            value={formData.screenId}
            onChange={handleInputChange}
            className="select select-bordered"
          >
            <option value="">Select Screen</option>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.price ? `($${s.price})` : ""}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="showDate"
            value={formData.showDate}
            onChange={handleInputChange}
            className="input input-bordered"
          />
          <input
            type="time"
            name="showTime"
            value={formData.showTime}
            onChange={handleInputChange}
            className="input input-bordered"
          />
          <input
            type="email"
            name="adminEmail"
            placeholder="Admin Email"
            value={formData.adminEmail}
            onChange={handleInputChange}
            className="input input-bordered"
          />

          <button onClick={addShow} className="btn btn-primary">
            Add Show
          </button>
        </div>
      </div>

      {/* Shows Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Screen</th>
              <th>Date</th>
              <th>Time</th>
              <th>Admin Email</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shows.length > 0 ? (
              shows.map((show) => (
                <tr key={show.id}>
                  <td>{show.movieTitle}</td>
                  <td>
                    {show.screenName} {show.screenPrice ? `($${show.screenPrice})` : ""}
                  </td>
                  <td>{show.showDate}</td>
                  <td>{show.showTime}</td>
                  <td>{show.adminEmail}</td>
                  <td className="flex gap-2">
                    <button className="btn btn-sm btn-neutral">Edit</button>
                    <button
                      onClick={() => deleteShow(show.id)}
                      className="btn btn-sm btn-accent"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center">
                  No Shows Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShowManagement;
