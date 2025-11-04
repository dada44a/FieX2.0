import { createLazyFileRoute } from "@tanstack/react-router";
import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { Input } from "@/components/input";
import { Button } from "@/components/Button";
import { z } from "zod";
import { useEditData } from "@/hooks/useAddData";

export const Route = createLazyFileRoute('/protected/admin/edit/$edit')({
  component: RouteComponent,
})

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: { Input },
  formComponents: { Button },
  fieldContext,
  formContext,
});

export default function RouteComponent() {
  const putData = useEditData();

  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
      genre: '',
      casts: '',
      releaseDate: '',
      imageLink: '',
    },
    validators: {
      onChange: z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        genre: z.string().min(1, "Genre is required"),
        casts: z.string().min(1, "Cast is required"),
        releaseDate: z.string().min(1, "Release Date is required"),
        imageLink: z.string().min(1, "Image Link is required"),
      }),
    },
    onSubmit: async (values) => {

      await putData.mutateAsync({
        datas: values.value,
        link: '/api/movies/',
        queryKey: ['movies']
      });
      form.reset();
    },



  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit A Movie</h1>

      {/* Error message */}
      {putData.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{putData.error.message}</div>
      )}

      {/* Success message */}
      {putData.isSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{`Movie "${JSON.stringify(putData.data)}" edited successfully!`}</div>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {/* Title */}
        <form.AppField
          name="title"
          children={(field) => (
            <field.Input
              label="Title"
              placeholder="Movie title"
              value={field.state.value}
              onChange={(e: any) => field.handleChange(e.target.value)}
            />
          )}
        />

        {/* Description */}
        <form.AppField
          name="description"
          children={(field) => (
            <div className="form-control">
              <label className="label"><span className="label-text">Description</span></label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Movie description"
                value={field.state.value || ""}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.getMeta().errors?.[0] && (
                <p className="text-red-600 mt-1">{field.getMeta().errors[0]?.message}</p>
              )}
            </div>
          )}
        />

        {/* Genre */}
        <form.AppField
          name="genre"
          children={(field) => (
            <field.Input
              label="Genre (comma-separated)"
              placeholder="Action, Comedy, Drama"
              value={field.state.value}
              onChange={(e: any) => field.handleChange(e.target.value)}
            />
          )}
        />

        {/* Cast */}
        <form.AppField
          name="casts"
          children={(field) => (
            <field.Input
              label="Cast (comma-separated)"
              placeholder="Tom Cruise, Emily Blunt"
              value={field.state.value}
              onChange={(e: any) => field.handleChange(e.target.value)}
            />
          )}
        />

        {/* Release Date */}
        <form.AppField
          name="releaseDate"
          children={(field) => (
            <input
              type="date"
              className="input input-bordered w-full"
              value={field.state.value || ""}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        />

        {/* Image Upload */}
        <form.AppField
          name="imageLink"
          children={(field) => (
            <div className="form-control">
              <label className="label"><span className="label-text">Movie Poster</span></label>
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const data = new FormData();
                  data.append("file", file);
                  data.append("upload_preset", "anish_preset");
                  data.append("cloud_name", "dt9wttbcm");

                  try {
                    const res = await fetch("https://api.cloudinary.com/v1_1/dt9wttbcm/image/upload", {
                      method: "POST",
                      body: data
                    });
                    if (!res.ok) throw new Error("Upload failed");
                    const result = await res.json();
                    field.setValue(result.secure_url);
                  } catch (err) {
                    console.error(err);
                    alert("Image upload failed. Please try again.");
                  }
                }}
              />
              {field.state.value && (
                <img
                  src={field.state.value}
                  alt="Preview"
                  className="mt-2 rounded w-40 h-auto"
                />
              )}
              {field.getMeta().errors?.[0] && (
                <p className="text-red-600 mt-1">{field.getMeta().errors[0]?.message}</p>
              )}
            </div>
          )}
        />

        <Button type="submit" disabled={putData.isPending}>
          {putData.isPending ? "Saving..." : "Save Movie"}
        </Button>

        
      </form>
    </div>
  );
}
