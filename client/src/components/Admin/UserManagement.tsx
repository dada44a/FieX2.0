import  { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [updatedRole, setUpdatedRole] = useState<string>("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/Users/all");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setUpdatedRole(user.role);
  };

  const handleSaveClick = async (userId: number) => {
    // Optional: API call to update role
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, role: updatedRole } : user
    );

    try {
      const response = await fetch(
        `http://localhost:8080/api/Users/${userId}/update_role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: updatedRole.toLowerCase() })
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
    setUsers(updatedUsers);
    setEditingUserId(null);
    setUpdatedRole("");
  };

  const handleCancelClick = () => {
    setEditingUserId(null);
    setUpdatedRole("");
  };

  const handleDeleteClick = async (userId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/Users/${userId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
    const updatedUsers = users.filter((user) => user.id !== userId);
    setUsers(updatedUsers);
  };

  return (
    <>
      <div className="flex flex-row items-center gap-2">
        <input type="text" placeholder="Type here" className="input my-3 outline-0" />
        <button className="btn btn-md btn-warning">Search</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <div className="font-bold">{user.name}</div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={updatedRole}
                        onChange={(e) => setUpdatedRole(e.target.value)}
                        className="input input-sm"
                      />
                    ) : (
                      <span>{user.role}</span>
                    )}
                  </td>
                  <td>{user.phone || "N/A"}</td>
                  <td>
                    <div className="flex gap-2">
                      {editingUserId === user.id ? (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleSaveClick(user.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={handleCancelClick}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-sm btn-neutral"
                            onClick={() => handleEditClick(user)}
                          >
                            Edit
                          </button>
                          <button className="btn btn-sm btn-error" onClick={() => handleDeleteClick(user.id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-4">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UserManagement;
