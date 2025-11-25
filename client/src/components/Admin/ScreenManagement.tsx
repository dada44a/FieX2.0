import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import Table from "../Table";
import { useForm } from "@tanstack/react-form";
import { useAddData, useDeleteData, useEditData } from "@/hooks/useAddData";
import { useQuery } from "@tanstack/react-query";
import { LoadingTable } from "../loadingtable";

interface Screen {
  id: number;
  name: string;
  price: number;
}

const ScreenManagement: React.FC = () => {
  const add = useAddData()
  const edit = useEditData()
  const deleteData = useDeleteData()
  const [formScreen, setFormScreen] = useState<{ id: number | null; name: string; price: string }>({
    id: null,
    name: "",
    price: "",
  });
  const [isEditingScreen, setIsEditingScreen] = useState(false);

  const columnHelper = createColumnHelper<Screen>();
  /** ---------- FETCH SCREENS ---------- */
  const {data, isLoading, isError} = useQuery({
    queryKey: ['screens'],
    queryFn: async () => {
      const res = await fetch("http://localhost:4000/api/screens");
      if (!res.ok) {
        throw new Error("Failed to fetch screens");
      }
      const data = await res.json();
      return data.data || [];
    },
  });

  const handleEditScreen = (screen: Screen) => {
    setFormScreen({ id: screen.id, name: screen.name, price: screen.price.toString() });
    setIsEditingScreen(true);
  };



  const handleDeleteScreen = async (id: number) => {
    if (!window.confirm("Delete this screen?")) return;
    try {
      deleteData.mutateAsync({
        link: `/api/screens/${id}`,
        queryKey: ["screens"]
      })
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

  const form = useForm({
    defaultValues: {
      name: "",
      price: ""
    },
    onSubmit: (values) => {
      if (!isEditingScreen) {
        add.mutateAsync({
          link: '/api/screens',
          datas: {
            name: values.value.name,
            price: Number(values.value.price)
          },
          queryKey: ["screens"]
        })
        form.reset()
      }

      edit.mutateAsync({
        link: `/api/screens/${formScreen.id}`,
        datas: {
          name: values.value.name,
          price: Number(values.value.price)
        },
        queryKey: ["screens"]
      })
      form.reset()
      setIsEditingScreen(false);
      setFormScreen({ id: null, name: "", price: "" });
    }
  })

  return (

    <div className="p-6">

      <h2 className="text-xl font-bold mb-4">Screen Management</h2>

      {/* Screen Form */}
      {isEditingScreen ? <h3 className="text-sm font-semibold mb-2">Edit Screen {formScreen.name}</h3> : ""}
      <form className="flex gap-2" onSubmit={
        (e) => {
          e.preventDefault()
          form.handleSubmit()
        }
      }>
        <form.Field
          name="name"
          children={(field) => {
            return (
              <>
                <input
                  type="text"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Screen Name"
                  className="input input-bordered"
                  required
                />
              </>
            )
          }}
        />

        <form.Field
          name="price"
          children={(field) => {
            return (
              <>
                <input
                  type="text"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Price"
                  className="input input-bordered"
                  required
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
      {isLoading && <LoadingTable wantToShow={false} />}
      
      {isError?<div>Error loading screens</div> :<Table data={data || []} columns={columns} />}


    </div>

  );
};

export default ScreenManagement;
