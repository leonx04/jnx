"use client"

import { useAuthContext } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { database } from "@/firebaseConfig"
import { get, ref } from "firebase/database"
import { ArrowLeft } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import ProductReview from "@/app/components/ProductReview"

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
  total: number
  status: string
  paymentMethod: string
  createdAt: string
}

interface Review {
  rating: number
  comment: string
  createdAt: string
}

export default function OrderDetail() {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const { user } = useAuthContext()
  const params = useParams()
  const orderId = params.id as string

  const fetchOrder = async () => {
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để xem chi tiết đơn hàng")
      setIsLoading(false)
      return
    }

    try {
      const orderRef = ref(database, `orders/${user.id}/${orderId}`)
      const snapshot = await get(orderRef)
      
      if (snapshot.exists()) {
        const orderData = snapshot.val()
        setOrder({ id: orderId, ...orderData })
      } else {
        toast.error("Không tìm thấy thông tin đơn hàng")
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết đơn hàng:", error)
      toast.error("Không thể tải thông tin đơn hàng")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [user, orderId])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!order || order.status !== 'delivered' || !order.items || !Array.isArray(order.items)) return;

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
      }, {} as Record<string, Review>)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // eslint-disable-next-line
      setReviews(newReviews)
    }

    fetchReviews()
  }, [order, user])

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "pending": "Đang xử lý",
      "processing": "Đang chuẩn bị",
      "shipped": "Đã giao hàng",
      "delivered": "Đã nhận hàng",
      "cancelled": "Đã hủy"
    }
    return statusMap[status.toLowerCase()] || status
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "text-green-600"
      case "cancelled":
        return "text-red-600"
      default:
        return "text-yellow-600"
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cod":
        return "Thanh toán khi nhận hàng (COD)"
      case "vnpay":
        return "Thanh toán qua VNPAY"
      default:
        return method
    }
  }

  const handleReviewSubmitted = () => {
    fetchOrder()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Chi Tiết Đơn Hàng</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-lg">Không tìm thấy thông tin đơn hàng.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/pages/account/orders" className="inline-flex items-center mb-4 text-blue-600 hover:text-blue-800">
        <ArrowLeft className="mr-2" size={20} />
        Quay lại danh sách đơn hàng
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">Chi Tiết Đơn Hàng #{order.id.slice(-6)}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Thông Tin Đơn Hàng</span>
            <span className={`text-sm font-normal ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Ngày đặt hàng:</strong> {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          <p><strong>Phương thức thanh toán:</strong> {getPaymentMethodLabel(order.paymentMethod)}</p>
          <p><strong>Tổng tiền:</strong> {order.total.toLocaleString("vi-VN")} ₫</p>
          <p><strong>Phí vận chuyển:</strong> {order.shippingFee.toLocaleString("vi-VN")} ₫</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thông Tin Giao Hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Họ tên:</strong> {order.fullName}</p>
          <p><strong>Số điện thoại:</strong> {order.phoneNumber}</p>
          <p><strong>Địa chỉ:</strong> {`${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sản Phẩm Đã Mua</CardTitle>
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
                    <p className="text-sm text-gray-600">Đơn giá: {item.price.toLocaleString("vi-VN")} ₫</p>
                  </div>
                  <p className="font-semibold">{(item.price * item.quantity).toLocaleString("vi-VN")} ₫</p>
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
        <Button asChild>
          <Link href="/pages/account/orders">
            Quay lại danh sách đơn hàng
          </Link>
        </Button>
      </div>
    </div>
  )
}

