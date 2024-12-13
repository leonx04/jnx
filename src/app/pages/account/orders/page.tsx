"use client"

import { useAuthContext } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { database } from "@/firebaseConfig"
import { get, ref } from "firebase/database"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  productId: string
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

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        toast.error("Vui lòng đăng nhập để xem đơn hàng")
        setIsLoading(false)
        return
      }

      try {
        const ordersRef = ref(database, `orders/${user.id}`)
        const snapshot = await get(ordersRef)

        if (snapshot.exists()) {
          const ordersData = snapshot.val()
          // eslint-disable-next-line
          const ordersArray = Object.entries(ordersData).map(([id, data]: [string, any]) => ({
            id,
            ...data,
            items: Array.isArray(data.items) ? data.items : []
          }))
          setOrders(ordersArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        } else {
          setOrders([])
        }
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error)
        toast.error("Không thể tải đơn hàng")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "pending": "Đã đặt hàng",
      "processing": "Đang chuẩn bị",
      "shipping": "Đang giao hàng",
      "shipped": "Đã giao hàng",
      "delivered": "Đã nhận hàng",
      "reviewed": "Đã đánh giá",
      "completed": "Đã hoàn thành",
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

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <p className="text-gray-600 text-lg">Vui lòng đăng nhập để xem lịch sử đơn hàng.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Lịch Sử Đơn Hàng</h1>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-lg">Bạn chưa có đơn hàng nào.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Đơn hàng #{order.id.slice(-6)}</span>
                  <span className={`text-sm font-normal ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                  <div>
                    <p className="text-sm text-gray-600">
                      Ngày đặt hàng: {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Địa chỉ: {`${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phương thức thanh toán: {getPaymentMethodLabel(order.paymentMethod)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      Tổng cộng: {order.total.toLocaleString("vi-VN")} ₫
                    </p>
                    <Button asChild className="mt-2">
                      <Link href={`/pages/account/orders/${order.id}`}>
                        Xem chi tiết
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {order.items && order.items.length > 0 ? (
                    <>
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center space-x-4">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={50}
                            height={50}
                            className="object-cover rounded-md"
                          />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} x {item.price.toLocaleString("vi-VN")} ₫
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-600">
                          và {order.items.length - 2} sản phẩm khác
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">Không có thông tin về sản phẩm</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

