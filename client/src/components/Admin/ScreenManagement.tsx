import React, { useEffect, useState } from "react";

const PAGE_SIZE = 5;

interface Screen {
  id: number;
  name: string;
  price: number;
}

interface Seat {
  id: number;
  rows: string;
  columns: number;
}

const ScreenManagement: React.FC = () => {
  /** ---------- SCREENS ---------- */
  const [screens, setScreens] = useState<Screen[]>([]);
  const [formScreen, setFormScreen] = useState<{ id: number | null; name: string; price: string }>({
    id: null,
    name: "",
    price: "",
  });
  const [isEditingScreen, setIsEditingScreen] = useState(false);

  /** ---------- SEATS ---------- */
  const [expandedScreen, setExpandedScreen] = useState<number | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatForm, setSeatForm] = useState<{ id: number | null; row: string; column: string }>({
    id: null,
    row: "",
    column: "",
  });
  const [isEditingSeat, setIsEditingSeat] = useState(false);
  const [seatPage, setSeatPage] = useState(1);

  /** ---------- FETCH SCREENS ---------- */
  const fetchScreens = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/screen");
      const data: Screen[] = await res.json();
      setScreens(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchScreens();
  }, []);

  /** ---------- SCREEN FORM HANDLERS ---------- */
  const handleScreenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormScreen({ ...formScreen, [name]: value });
  };

  const handleAddScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:8080/api/screen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formScreen.name, price: Number(formScreen.price) }),
    });
    setFormScreen({ id: null, name: "", price: "" });
    fetchScreens();
  };

  const handleEditScreen = (screen: Screen) => {
    setFormScreen({ id: screen.id, name: screen.name, price: screen.price.toString() });
    setIsEditingScreen(true);
  };

  const handleUpdateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formScreen.id === null) return;
    await fetch(`http://localhost:8080/api/screen/${formScreen.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formScreen.name, price: Number(formScreen.price) }),
    });
    setFormScreen({ id: null, name: "", price: "" });
    setIsEditingScreen(false);
    fetchScreens();
  };

  const handleDeleteScreen = async (id: number) => {
    if (!window.confirm("Delete this screen?")) return;
    await fetch(`http://localhost:8080/api/screen/${id}`, { method: "DELETE" });
    if (expandedScreen === id) setExpandedScreen(null);
    fetchScreens();
  };

  /** ---------- SEAT HANDLERS ---------- */
  const fetchSeats = async (screenId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/seat/screen/${screenId}`);
      const data: Seat[] = await res.json();
      setSeats(data);
      setSeatPage(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSeatForm({ ...seatForm, [name]: value });
  };

  const handleAddSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedScreen) return;
    const dto = {
      row: seatForm.row,
      column: Number(seatForm.column),
      screenId: expandedScreen,
    };
    await fetch("http://localhost:8080/api/seat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    setSeatForm({ id: null, row: "", column: "" });
    fetchSeats(expandedScreen);
  };

  const handleEditSeat = (seat: Seat) => {
    setSeatForm({ id: seat.id, row: seat.rows, column: seat.columns.toString() });
    setIsEditingSeat(true);
  };

  const handleUpdateSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedScreen || seatForm.id === null) return;
    const dto = {
      row: seatForm.row,
      column: Number(seatForm.column),
      screenId: expandedScreen,
    };
    await fetch(`http://localhost:8080/api/seat/${seatForm.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    setSeatForm({ id: null, row: "", column: "" });
    setIsEditingSeat(false);
    fetchSeats(expandedScreen);
  };

  const handleDeleteSeat = async (id: number) => {
    if (!window.confirm("Delete this seat?")) return;
    await fetch(`http://localhost:8080/api/seat/${id}`, { method: "DELETE" });
    if (expandedScreen) fetchSeats(expandedScreen);
  };

  /** ---------- PAGINATION ---------- */
  useEffect(() => {
    setSeatPage(1);
  }, [seats]);

  const totalSeatPages = Math.ceil(seats.length / PAGE_SIZE);
  const paginatedSeats = seats.slice((seatPage - 1) * PAGE_SIZE, seatPage * PAGE_SIZE);

  /** ---------- RENDER ---------- */
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Screen Management</h2>

      {/* Screen Form */}
      <form
        onSubmit={isEditingScreen ? handleUpdateScreen : handleAddScreen}
        className="mb-6 flex gap-4 items-center flex-wrap"
      >
        <input
          type="text"
          name="name"
          value={formScreen.name}
          onChange={handleScreenChange}
          placeholder="Screen Name"
          className="input input-bordered"
          required
        />
        <input
          type="number"
          name="price"
          value={formScreen.price}
          onChange={handleScreenChange}
          placeholder="Price"
          className="input input-bordered"
          required
        />
        <button type="submit" className="btn btn-primary">
          {isEditingScreen ? "Update" : "Add"}
        </button>
        {isEditingScreen && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setFormScreen({ id: null, name: "", price: "" });
              setIsEditingScreen(false);
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Screen Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {screens.map((screen) => (
              <React.Fragment key={screen.id}>
                <tr
                  className="cursor-pointer"
                  onClick={() => {
                    if (expandedScreen === screen.id) {
                      setExpandedScreen(null);
                      setSeats([]);
                    } else {
                      setExpandedScreen(screen.id);
                      fetchSeats(screen.id);
                    }
                  }}
                >
                  <td>{screen.id}</td>
                  <td>{screen.name}</td>
                  <td>{screen.price}</td>
                  <td className="flex gap-2">
                    <button
                      className="btn btn-sm btn-neutral"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditScreen(screen);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScreen(screen.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {/* Expanded Seats */}
                {expandedScreen === screen.id && (
                  <tr>
                    <td colSpan={4}>
                      <div className="p-4 text-white rounded-lg border border-gray-700">
                        <h3 className="font-semibold mb-2">Seats for {screen.name}</h3>

                        {/* Seat Form */}
                        <form
                          onSubmit={isEditingSeat ? handleUpdateSeat : handleAddSeat}
                          className="mb-4 flex gap-4 items-center flex-wrap"
                        >
                          <input
                            type="text"
                            name="row"
                            value={seatForm.row}
                            onChange={handleSeatChange}
                            placeholder="Row (e.g. A)"
                            className="input input-bordered bg-gray-800 text-white border-gray-600"
                            required
                          />
                          <input
                            type="number"
                            name="column"
                            value={seatForm.column}
                            onChange={handleSeatChange}
                            placeholder="Column"
                            className="input input-bordered bg-gray-800 text-white border-gray-600"
                            required
                          />
                          <button type="submit" className="btn btn-primary">
                            {isEditingSeat ? "Update" : "Add"}
                          </button>
                          {isEditingSeat && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => {
                                setSeatForm({ id: null, row: "", column: "" });
                                setIsEditingSeat(false);
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </form>

                        {/* Seat Table */}
                        <table className="table w-full text-white">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Row</th>
                              <th>Column</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedSeats.map((seat) => (
                              <tr key={seat.id} className="text-white">
                                <td>{seat.id}</td>
                                <td>{seat.rows}</td>
                                <td>{seat.columns}</td>
                                <td className="flex gap-2">
                                  <button
                                    className="btn btn-sm btn-neutral"
                                    onClick={() => handleEditSeat(seat)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-accent"
                                    onClick={() => handleDeleteSeat(seat.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {paginatedSeats.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-2">
                                  No seats found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* Pagination */}
                        {totalSeatPages > 1 && (
                          <div className="flex gap-2 mt-2 items-center">
                            <button
                              className="btn btn-sm"
                              disabled={seatPage === 1}
                              onClick={() => setSeatPage(seatPage - 1)}
                            >
                              Prev
                            </button>
                            <span>
                              {seatPage} / {totalSeatPages}
                            </span>
                            <button
                              className="btn btn-sm"
                              disabled={seatPage === totalSeatPages}
                              onClick={() => setSeatPage(seatPage + 1)}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScreenManagement;
