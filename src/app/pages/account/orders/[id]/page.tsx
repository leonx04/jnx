'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuthContext } from '@/app/context/AuthContext'
import { database } from '@/firebaseConfig'
import { ref, get, onValue } from 'firebase/database'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProductReview from '@/app/components/ProductReview'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  productId: string
  reviewed?: boolean
}

interface Order {
  id: string
  userId: string
  fullName: string
  phoneNumber: string
  shippingAddress: {
    province: string
    district: string
    ward: string
    address: string
  }
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  paymentMethod: string
  total: number
  status: string
  createdAt: string
}

interface Review {
  rating: number
  comment: string
  createdAt: string
}

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuthContext()
  const [order, setOrder] = useState<Order | null>(null)
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!user?.id || !id) {
      setError("Không thể tải thông tin đơn hàng. Vui lòng đăng nhập và thử lại.")
      setIsLoading(false)
      return
    }

    try {
      const orderRef = ref(database, `orders/${user.id}/${id}`)
      const snapshot = await get(orderRef)

      if (snapshot.exists()) {
        const orderData = snapshot.val()
        setOrder({ id, ...orderData })
      } else {
        setError("Không tìm thấy đơn hàng.")
      }
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng:', error)
      setError("Đã xảy ra lỗi khi tải thông tin đơn hàng. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }, [user, id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!order || order.status !== 'delivered' || !order.items || !Array.isArray(order.items)) return

      const reviewPromises = order.items.map(async (item) => {
        const reviewRef = ref(database, `reviews/${item.productId}`)
        const snapshot = await get(reviewRef)
        if (snapshot.exists()) {
          const reviewsData = snapshot.val()
          const userReview = Object.values(reviewsData).find((review: any) => review.userId === user?.id && review.orderId === order.id)
          if (userReview) {
            return { [item.productId]: userReview }
          }
        }
        return null
      })

      const reviewResults = await Promise.all(reviewPromises)
      const newReviews = reviewResults.reduce((acc, review) => {
        if (review) {
          return { ...acc, ...review }
        }
        return acc
      }, {})

      setReviews(newReviews)
    }

    fetchReviews()
  }, [order, user])

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Đang xử lý',
      'processing': 'Đang chuẩn bị',
      'shipped': 'Đã giao hàng',
      'delivered': 'Đã nhận hàng',
      'cancelled': 'Đã hủy'
    }
    return statusMap[status.toLowerCase()] || status
  }

  const handleReviewSubmitted = () => {
    fetchOrder()
  }

  if (isLoading) {
    return <div className="text-center py-10">Đang tải thông tin đơn hàng...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>
  }

  if (!order || !order.items || !Array.isArray(order.items)) {
    return <div className="text-center py-10">Không tìm thấy thông tin đơn hàng hoặc sản phẩm.</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Link href="/pages/account/orders" className="inline-flex items-center mb-4 text-blue-600 hover:text-blue-800">
        <ArrowLeft className="mr-2" size={20} />
        Quay lại danh sách đơn hàng
      </Link>

      <h1 className="text-3xl font-bold mb-6">Chi tiết đơn hàng #{order.id.slice(-6)}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thông tin đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Ngày đặt hàng:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          <p><strong>Trạng thái:</strong> <span className={`font-semibold ${
            order.status === 'delivered' ? 'text-green-600' : 
            order.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
          }`}>{getStatusLabel(order.status)}</span></p>
          <p><strong>Hình thức thanh toán:</strong> {
                order.paymentMethod === "cod" 
                  ? "Thanh toán khi nhận hàng (COD)" 
                  : order.paymentMethod === "vnpay"
                    ? "Thanh toán qua VNPAY"
                    : order.paymentMethod
              }</p>
          <p><strong>Tổng tiền:</strong> {order.total.toLocaleString('vi-VN')} ₫</p>
          <p><strong>Phí vận chuyển:</strong> {order.shippingFee.toLocaleString('vi-VN')} ₫</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thông tin giao hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Họ tên:</strong> {order.fullName}</p>
          <p><strong>Số điện thoại:</strong> {order.phoneNumber}</p>
          <p><strong>Địa chỉ:</strong> {`${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm đã mua</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-8">
            {order.items.map((item) => (
              <li key={item.id} className="border-b pb-6">
                <div className="flex items-center space-x-4">
                  <Image 
                    src={item.imageUrl} 
                    alt={item.name} 
                    width={80} 
                    height={80} 
                    className="object-cover rounded-md" 
                  />
                  <div className="flex-grow">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    <p className="text-sm text-gray-600">Đơn giá: {item.price.toLocaleString('vi-VN')} ₫</p>
                  </div>
                  <p className="font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</p>
                </div>
                {order.status === 'delivered' && (
                  <div className="mt-4">
                    {reviews[item.productId] ? (
                      <div className="bg-gray-100 p-4 rounded-md">
                        <p className="font-semibold">Đánh giá của bạn:</p>
                        <div className="flex items-center mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={`text-2xl ${star <= reviews[item.productId].rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="mt-2">{reviews[item.productId].comment}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Đánh giá vào: {new Date(reviews[item.productId].createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    ) : (
                      <ProductReview productId={item.productId} orderId={order.id} onReviewSubmitted={handleReviewSubmitted} />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-6 text-right">
        <Button variant="outline" asChild>
          <Link href="/pages/account/orders">
            Quay lại danh sách đơn hàng
          </Link>
        </Button>
      </div>
    </div>
  )
}

