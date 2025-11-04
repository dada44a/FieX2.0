import { useDeleteData } from '@/hooks/useAddData';
import { createLazyFileRoute } from '@tanstack/react-router'
import React from 'react';

export const Route = createLazyFileRoute('/protected/admin/delete/$delete')({
  component: RouteComponent,
})

function RouteComponent() {
  const [modalOpen] = React.useState(true);
  const { delete: deleteId } = Route.useMatch().params;
  const navigate = Route.useNavigate();

  const deleteMovie = useDeleteData();  

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMovie.mutateAsync({
        link: `/api/movies/${deleteId}`,
        queryKey: ['movies']
      },
    {
        onSuccess: () => {
          navigate({ to: '/protected/admin' });
        },
        onError: (error) => {
          alert(`Error deleting movie: ${error.message}`);
        }
    });
    }
  };

  const handleClose = () => {
    navigate({ to: '/protected/admin' });
  };


  return <div className='h-screen flex items-center justify-center'>{modalOpen && (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Are you sure you want to delete this movie?</h3>
        {/* Add Movie Form Content Here */}
        <div className="flex gap-3 justify-end">
          <div className="modal-action">
            <button
              className="btn"
              onClick={handleDelete}
            >
              Yes
            </button>
          </div>

          <div className="modal-action">
            <button
              className="btn"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  }</div>
}
