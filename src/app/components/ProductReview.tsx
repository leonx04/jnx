'use client'

import { useState } from 'react'
import { useAuthContext } from '@/app/context/AuthContext'
import { database } from '@/firebaseConfig'
import { ref, push, set, get, update } from 'firebase/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'

interface ProductReviewProps {
  productId: string
  orderId: string
  onReviewSubmitted: () => void
}

interface OrderItem {
  productId: string
  reviewed?: boolean
}

export default function ProductReview({ productId, orderId, onReviewSubmitted }: ProductReviewProps) {
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { user } = useAuthContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá sản phẩm')
      return
    }
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá')
      return
    }
    setIsSubmitting(true)

    try {
      // Add the review
      const reviewRef = ref(database, `reviews/${productId}`)
      const newReviewRef = push(reviewRef)
      await set(newReviewRef, {
        userId: user.id,
        rating,
        comment,
        createdAt: new Date().toISOString(),
        orderId
      })

      // Update the reviewed status for the product in the order
      const orderProductRef = ref(database, `orders/${user.id}/${orderId}/items`)
      const orderSnapshot = await get(orderProductRef)
      if (orderSnapshot.exists()) {
        const items: OrderItem[] = orderSnapshot.val()
        const updatedItems = items.map((item) => 
          item.productId === productId ? { ...item, reviewed: true } : item
        )
        await set(orderProductRef, updatedItems)
      }

      // Update the product's rating and review count
      const productRef = ref(database, `products/${productId}`)
      const productSnapshot = await get(productRef)
      
      if (productSnapshot.exists()) {
        const productData = productSnapshot.val()
        const currentRating = productData.rating || 0
        const currentReviewCount = productData.reviewCount || 0
        
        const newReviewCount = currentReviewCount + 1
        const newRating = ((currentRating * currentReviewCount) + rating) / newReviewCount

        await update(productRef, {
          rating: newRating,
          reviewCount: newReviewCount
        })
      } 

      toast.success('Đánh giá của bạn đã được gửi thành công')
      setRating(0)
      setComment('')
      onReviewSubmitted()
    } catch (error) {
      console.error('Lỗi khi gửi đánh giá:', error)
      toast.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Nhận xét
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này"
          rows={4}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
      </Button>
    </form>
  )
}

