import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/protected/movie/payment-sucess')({
  component: RouteComponent,
  validateSearch: (search) => {
    return {
      pidx: String(search.pidx ?? ""),
      transaction_id: String(search.transaction_id ?? ""),
      tIdx: String(search.tIdx ?? ""),
      txnId: String(search.txnId ?? ""),
      amount: Number(search.amount ?? 0),
      total_amount: Number(search.total_amount ?? 0),
      mobile: String(search.mobile ?? ""),
      status: String(search.status ?? ""),
    }
  }



})

function RouteComponent() {
  return <div>Hello "/protected/movie/payment-sucess"!</div>
}
