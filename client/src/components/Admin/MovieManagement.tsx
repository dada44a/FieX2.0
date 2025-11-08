import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LoadingTable } from "../loadingtable";

interface Movie {
  id: number;
  title: string;
  genre: string;
  releaseDate: string;
  imageLink: string;
  casts: string;
  description: string;
}

const MovieManagement: React.FC = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const res = await fetch("http://localhost:4000/api/movies");
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      return res.json();
    },
  });

  const movies: Movie[] = data?.data || [];

  // ---------- Pagination Logic ----------
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.ceil(movies.length / pageSize);

  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return movies.slice(startIndex, startIndex + pageSize);
  }, [movies, currentPage, pageSize]);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  // ---------- Render ----------
  return (
    <div className="overflow-x-auto p-4">
      {/* Loading and Error States */}
      {isPending && <LoadingTable wantToShow={false} />}
      {error && <p className="text-red-500">{(error as Error).message}</p>}

      {/* Movies Table */}
      {!isPending && !error && movies.length > 0 && (
        <>
          <table className="table w-full">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Genre</th>
                <th>Cast</th>
                <th>Release Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovies.map((movie) => (
                <tr key={movie.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12">
                          <img
                            src={movie.imageLink}
                            alt={movie.title}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{movie.title}</div>
                        <div className="text-sm opacity-50">
                          {movie.description.slice(0, 40)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{movie.genre}</td>
                  <td>{movie.casts}</td>
                  <td>{movie.releaseDate}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to="/protected/admin/edit/$edit"
                        params={{ edit: movie.id.toString() }}
                        className="btn btn-sm btn-primary"
                      >
                        Edit
                      </Link>
                      <Link
                        to="/protected/admin/delete/$delete"
                        params={{ delete: movie.id.toString() }}
                        className="btn btn-sm btn-neutral"
                      >
                        Delete
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                className="btn btn-sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                ⏮ First
              </button>
              <button
                className="btn btn-sm"
                onClick={handlePrev}
                disabled={currentPage === 1}
              >
                ◀ Prev
              </button>
              <span>
                Page <strong>{currentPage}</strong> of {totalPages}
              </span>
              <button
                className="btn btn-sm"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next ▶
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last ⏭
              </button>
            </div>

            <select
              className="select select-bordered select-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1); // reset to first page
              }}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* If no movies */}
      {!isPending && !error && movies.length === 0 && (
        <p className="text-center mt-4 text-gray-500">No movies found.</p>
      )}
    </div>
  );
};

export default MovieManagement;
