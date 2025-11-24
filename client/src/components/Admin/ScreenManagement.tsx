import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";
import Table from "../Table";

interface Screen {
  id: number;
  name: string;
  price: number;
}

const ScreenManagement: React.FC = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [formScreen, setFormScreen] = useState<{ id: number | null; name: string; price: string }>({
    id: null,
    name: "",
    price: "",
  });
  const [isEditingScreen, setIsEditingScreen] = useState(false);

  const columnHelper = createColumnHelper<Screen>();
  /** ---------- FETCH SCREENS ---------- */
  const fetchScreens = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/screens");
      const data = await res.json();
      setScreens(data.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch screens");
    }
  };

  useEffect(() => {
    fetchScreens();
  }, []);

  /** ---------- SCREEN HANDLERS ---------- */
  const handleScreenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormScreen({ ...formScreen, [name]: value });
  };

  const handleAddScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/api/screens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formScreen.name, price: Number(formScreen.price) }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to add screen");
        return;
      }
      setFormScreen({ id: null, name: "", price: "" });
      fetchScreens();
    } catch (err) {
      console.error(err);
      alert("Failed to add screen");
    }
  };

  const handleEditScreen = (screen: Screen) => {
    setFormScreen({ id: screen.id, name: screen.name, price: screen.price.toString() });
    setIsEditingScreen(true);
  };

  const handleUpdateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formScreen.id === null) return;
    try {
      const res = await fetch(`http://localhost:4000/api/screens/${formScreen.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formScreen.name, price: Number(formScreen.price) }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to update screen");
        return;
      }
      setFormScreen({ id: null, name: "", price: "" });
      setIsEditingScreen(false);
      fetchScreens();
    } catch (err) {
      console.error(err);
      alert("Failed to update screen");
    }
  };

  const handleDeleteScreen = async (id: number) => {
    if (!window.confirm("Delete this screen?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/screens/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to delete screen");
        return;
      }
      fetchScreens();
    } catch (err) {
      console.error(err);
      alert("Failed to delete screen");
    }
  };

  const columns = useMemo(() => {

    return [
      columnHelper.accessor("id", {
        header: "ID",
      }),
      columnHelper.accessor("name", {
        header: "Name",
      }),
      columnHelper.accessor("price", {
        header: "Price",
      }),
      columnHelper.display({
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button className="btn btn-sm btn-neutral" onClick={() => handleEditScreen(row.original)}>Edit</button>
            <button className="btn btn-sm btn-error" onClick={() => handleDeleteScreen(row.original.id)}>Delete</button>
            <Link to="/protected/admin/$screenid/seats" params={{ screenid: row.original.id.toString() }} className="btn btn-sm btn-ghost">Seats</Link>
          </div>
        ),
      }),
    ];
  }, []);


  return (

    <div className="p-6">

      <h2 className="text-xl font-bold mb-4">Screen Management</h2>

      {/* Screen Form */}
      <form onSubmit={isEditingScreen ? handleUpdateScreen : handleAddScreen} className="mb-6 flex gap-4 flex-wrap">
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
        <button type="submit" className="btn btn-primary">{isEditingScreen ? "Update" : "Add"}</button>
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

      <Table data={screens} columns={columns} />
    </div>

  );
};

export default ScreenManagement;
