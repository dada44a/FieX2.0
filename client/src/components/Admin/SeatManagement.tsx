'use client';
import React, { useEffect, useState} from "react";
import type { ChangeEvent, FormEvent } from "react";


interface Screen {
  id: number;
  name: string;
  price: number;
}

const ScreenManagement: React.FC = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [form, setForm] = useState<{
    id: number | null;
    name: string;
    price: string;
  }>({ id: null, name: "", price: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all screens
  const fetchScreens = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/screen");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: Screen[] = await res.json();
      setScreens(data);
    } catch (err) {
      console.error("Failed to fetch screens:", err);
    }
  };

  useEffect(() => {
    fetchScreens();
  }, []);

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Add new screen
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:8080/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, price: Number(form.price) }),
      });
      setForm({ id: null, name: "", price: "" });
      fetchScreens();
    } catch (err) {
      console.error("Failed to add screen:", err);
    }
  };

  // Edit screen
  const handleEdit = (screen: Screen) => {
    setForm({ id: screen.id, name: screen.name, price: String(screen.price) });
    setIsEditing(true);
  };

  // Update screen
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (form.id === null) return;
    try {
      await fetch(`http://localhost:8080/api/screen/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, price: Number(form.price) }),
      });
      setForm({ id: null, name: "", price: "" });
      setIsEditing(false);
      fetchScreens();
    } catch (err) {
      console.error("Failed to update screen:", err);
    }
  };

  // Delete screen
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this screen?")) return;
    try {
      await fetch(`http://localhost:8080/api/screen/${id}`, { method: "DELETE" });
      fetchScreens();
    } catch (err) {
      console.error("Failed to delete screen:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Screen Management</h2>

      {/* Form */}
      <form
        onSubmit={isEditing ? handleUpdate : handleAdd}
        className="mb-6 flex gap-4 items-center"
      >
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Screen Name"
          className="input input-bordered"
          required
        />
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          className="input input-bordered"
          required
        />
        <button type="submit" className="btn btn-primary">
          {isEditing ? "Update" : "Add"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setForm({ id: null, name: "", price: "" });
              setIsEditing(false);
            }}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        )}
      </form>

      {/* Table */}
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
            {screens.length > 0 ? (
              screens.map((screen) => (
                <tr key={screen.id}>
                  <td>{screen.id}</td>
                  <td>{screen.name}</td>
                  <td>{screen.price}</td>
                  <td>
                    <div className="flex gap-3">
                      <button
                        className="btn btn-sm btn-neutral"
                        onClick={() => handleEdit(screen)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-accent"
                        onClick={() => handleDelete(screen.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  No screens found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScreenManagement;
