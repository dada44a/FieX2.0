import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/protected/movie/payment-success')({
  component: RouteComponent,
});

function RouteComponent() {
  const data: any = Route.useSearch();

  const {
    pidx,
    transaction_id,
    tidx,
    txnId,
    amount,
    total_amount,
    mobile,
    phone,
    status,
    purchase_order_id,
    purchase_order_name,
    showId,
    customerId,
  } = data;

  const isSuccess = status === "Completed";

  const handleUpdate = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_LINK}/api/seats/booked`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: showId,
          userId: customerId,
          transaction_id,
          mobile,
          pidx,
          phone
        }),
      });
    } catch (error) {
      console.error('Error updating seat status:', error);
    }
  }

  useEffect(() => {
    if (!isSuccess) return; // Only run for successful payments

    const key = `payment-${pidx}-processed`;

    if (sessionStorage.getItem(key)) return;

    handleUpdate();

    sessionStorage.setItem(key, 'true');

  }, [pidx, isSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white">
      <div className="max-w-2xl w-full shadow-lg rounded-xl p-8">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${isSuccess ? 'bg-primary' : 'bg-error'}`}>
            {isSuccess ? (
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isSuccess ? "Payment Successful!" : "Payment Failed"}
          </h1>
          <p>
            {isSuccess ? "Thank you for your purchase." : "Something went wrong with your payment."}
          </p>
        </div>

        {/* Payment Details */}
        <div className="border-t border-gray-600 pt-4">
          <h2 className="text-lg font-semibold mb-2">Payment Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <span className="font-medium">Purchase Order:</span>
            <span>{purchase_order_name || purchase_order_id}</span>

            <span className="font-medium">Pidx:</span>
            <span>{pidx}</span>

            <span className="font-medium">Transaction ID:</span>
            <span>{transaction_id || txnId || tidx}</span>

            <span className="font-medium">Amount:</span>
            <span>Rs. {amount / 100 || total_amount / 100}</span>

            <span className="font-medium">Mobile:</span>
            <span>{mobile}</span>

            <span className="font-medium">Show ID:</span>
            <span>{showId}</span>

            <span className="font-medium">Status:</span>
            <span className={`font-bold ${isSuccess ? 'text-primary' : 'text-error'}`}>
              {status}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          {isSuccess ? (
            <Link
              to="/"
              className="px-6 py-2 bg-accent text-white font-semibold rounded-lg shadow hover:bg-blue-800 transition"
            >
              Go to Home
            </Link>
          ) : (
            <a
              href="/protected/movie/payment"
              className="px-6 py-2 bg-red-700 text-white font-semibold rounded-lg shadow hover:bg-red-800 transition"
            >
              Try Again
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
