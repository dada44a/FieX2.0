import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/test')({
  component: RouteComponent,
})

function RouteComponent() {
  const handleClick = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_LINK}/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication

      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response from server:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  return (
    <div>
      <div>Hello "/test"!</div>
      <button onClick={handleClick}>Send Test Request</button>
    </div>
  );
}