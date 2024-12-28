'use client'

import { useAuthContext } from '@/app/context/AuthContext'  // Nhập context xác thực người dùng
import { Button } from '@/components/ui/button'  // Nhập thành phần Button từ thư viện UI
import { Textarea } from '@/components/ui/textarea'  // Nhập thành phần Textarea từ thư viện UI
import { database } from '@/firebaseConfig'  // Nhập cấu hình Firebase
import { faStar } from '@fortawesome/free-solid-svg-icons'  // Nhập biểu tượng sao từ Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'  // Nhập FontAwesomeIcon để hiển thị biểu tượng
import { get, push, ref, set, update } from 'firebase/database'  // Nhập các hàm từ Firebase để thao tác với cơ sở dữ liệu
import { useState } from 'react'  // Nhập hook useState để quản lý trạng thái
import { toast } from 'react-hot-toast'  // Nhập thư viện toast để hiển thị thông báo

// Định nghĩa các interface cho props và dữ liệu liên quan
interface ProductReviewProps {
  productId: string  // ID của sản phẩm cần đánh giá
  orderId: string  // ID của đơn hàng đã mua sản phẩm
  onReviewSubmitted: () => void  // Callback khi đánh giá được gửi thành công
}

interface OrderItem {
  productId: string  // ID sản phẩm trong đơn hàng
  reviewed?: boolean  // Trạng thái đã đánh giá hay chưa
}

export default function ProductReview({ productId, orderId, onReviewSubmitted }: ProductReviewProps) {
  // Các trạng thái cần thiết cho việc đánh giá
  const [rating, setRating] = useState<number>(0)  // Điểm đánh giá của người dùng
  const [comment, setComment] = useState<string>('')  // Nhận xét của người dùng
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)  // Trạng thái gửi đánh giá
  const { user } = useAuthContext()  // Lấy thông tin người dùng từ context

  // Xử lý sự kiện gửi đánh giá
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Kiểm tra người dùng đã đăng nhập chưa
    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá sản phẩm')
      return
    }

    // Kiểm tra người dùng đã chọn sao đánh giá chưa
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá')
      return
    }

    setIsSubmitting(true)  // Bắt đầu quá trình gửi đánh giá

    try {
      // Thêm đánh giá vào cơ sở dữ liệu
      const reviewRef = ref(database, `reviews/${productId}`)
      const newReviewRef = push(reviewRef)
      await set(newReviewRef, {
        userId: user.id,
        rating,
        comment,
        createdAt: new Date().toISOString(),
        orderId
      })

      // Cập nhật trạng thái đã đánh giá cho sản phẩm trong đơn hàng
      const orderProductRef = ref(database, `orders/${user.id}/${orderId}/items`)
      const orderSnapshot = await get(orderProductRef)
      if (orderSnapshot.exists()) {
        const items: OrderItem[] = orderSnapshot.val()
        const updatedItems = items.map((item) =>
          item.productId === productId ? { ...item, reviewed: true } : item
        )
        await set(orderProductRef, updatedItems)
      }

      // Cập nhật đánh giá trung bình và số lượng đánh giá của sản phẩm
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

      // Thông báo thành công và reset các trường input
      toast.success('Đánh giá của bạn đã được gửi thành công')
      setRating(0)
      setComment('')
      onReviewSubmitted()  // Gọi callback sau khi đánh giá đã được gửi
    } catch (error) {
      // Xử lý lỗi khi gửi đánh giá
      console.error('Lỗi khi gửi đánh giá:', error)
      toast.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)  // Kết thúc quá trình gửi
    }
  }

  return (
    // Form để người dùng nhập đánh giá
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            // Các nút sao để người dùng chọn đánh giá
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}  // Cập nhật số sao khi người dùng chọn
              className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              <FontAwesomeIcon icon={faStar} />  {/* Biểu tượng sao */}
            </button>
          ))}
        </div>
      </div>

      {/* Nhập nhận xét */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Nhận xét
        </label>
        <Textarea
          id="comment"
          value={comment}  // Gán giá trị nhận xét
          onChange={(e) => setComment(e.target.value)}  // Cập nhật khi người dùng thay đổi nhận xét
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này"
          rows={4}
        />
      </div>

      {/* Nút gửi đánh giá */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}  {/* Hiển thị trạng thái gửi */}
      </Button>
    </form>
  )
}
