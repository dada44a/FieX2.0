
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';

export const Route = createFileRoute('/request-movie')({
  component: RequestMoviePage,
});

function RequestMoviePage() {
  const { user } = useUser();
  const [movieTitle, setMovieTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: { movieTitle: string; description: string; userId?: string }) => {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to submit request');
      }
      return res.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      setMovieTitle('');
      setDescription('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle.trim()) return;

    mutate({
      movieTitle,
      description,
      userId: user?.id
    });
  };

  return (
    <main className="min-h-screen py-10 px-4 bg-base-100">
      <div className="cineverse-container max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary">Request a Movie</h1>

        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <p className="mb-6 text-opacity-80">
              Can't find what you're looking for? Let us know which movie you'd like to see at our theater!
            </p>

            {showSuccess ? (
              <div role="alert" className="alert alert-success shadow-md animate-in fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <h3 className="font-bold">Request Submitted!</h3>
                  <div className="text-xs">Thank you for your suggestion. We'll review it shortly.</div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowSuccess(false)}>Submit Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Movie Title</legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="e.g. Inception"
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    required
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend font-semibold">Description (Optional)</legend>
                  <textarea
                    className="textarea textarea-bordered h-24 w-full"
                    placeholder="e.g. It's a great sci-fi movie directed by Christopher Nolan."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </fieldset>

                {error && (
                  <div className="alert alert-error text-sm">
                    <span>{error.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full mt-4"
                  disabled={isPending}
                >
                  {isPending ? <span className="loading loading-spinner"></span> : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
