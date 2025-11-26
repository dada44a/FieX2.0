import { createColumnHelper } from "@tanstack/react-table";

import { useMemo, useState } from "react";
import Table from "../Table";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useDeleteData, useEditData } from "@/hooks/useAddData";

// {
//     "id": 6,
//     "name": "ANISH GHIMIRE",
//     "email": "anishbim22@oic.edu.np",
//     "role": "ADMIN",
//     "points": 0,
//     "clerkId": "user_360XmSLBMIFWko3zCPFA2R8q5oc"
//   }

enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  points: number;
  clerkId: string;
}

const columnHelper = createColumnHelper<User>();

const UserManagement = () => {
  const [users, setUsers] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const edit = useEditData();
  const deleteData = useDeleteData();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const res = await fetch('http://localhost:4000/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  })

  const column = useMemo(() => {
    return [
      columnHelper.accessor('id', { header: 'ID' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('role', { header: 'Role' }),
      columnHelper.accessor('clerkId', { header: 'Clerk ID' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-neutral"
                onClick={() => { setUsers(user.id); setIsEditing(true); }}
              >
                Edit
              </button>
              <button className="btn btn-sm btn-error" onClick={() => setUsers(user.id)}>Delete</button>
            </div>
          )
        }
      })
    ];
  }, []);

  const form = useForm({
    defaultValues: {
      role: '',
    },
    onSubmit: (values) => {
      if (isEditing) {
        // Update user role logic here
        edit.mutateAsync({
          link: `/api/users/${users}`,
          datas: {
            role: values.value.role,
          },
          queryKey: ['users']
        })  
      } else {
        deleteData.mutateAsync({
          link: `/api/users/${users}`,
          queryKey: ['users']
        })
        
      }
    }
  })


  return (
    <>
      <div className="flex flex-row items-center gap-2">
        <input type="text" placeholder="Type here" className="input my-3 outline-0" value={users} disabled/>
      </div>

      <form className="flex gap-2" onSubmit={
        (e) => {
          e.preventDefault()
          form.handleSubmit()
        }
      }>
        <form.Field
          name="role"
          children={(field) => {
            return (
              <>
                <input
                  type="text"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Role"
                  className="input input-bordered"
                />
              </>
            )
          }}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <button type="submit" className="btn btn-primary" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
        />
      </form>

      <Table data={data ? data : []} columns={column} />
    </>
  );
};

export default UserManagement;
