import { Suspense } from 'react'
import OrderConfirmationContent from './OrderConfirmationContent'

export default function OrderConfirmation() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  )
}

