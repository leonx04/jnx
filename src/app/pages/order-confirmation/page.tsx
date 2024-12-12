"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { database } from "@/firebaseConfig"
import { ref, get } from "firebase/database"
import { useAuthContext } from "@/app/context/AuthContext"
import Image from "next/image"
import Link from "next/link"
import toast from "react-hot-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string
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

export default function OrderConfirmation() {
  const [latestOrder, setLatestOrder] = useState<Order | null>(null)
  const { user } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        if (!user?.id) {
          toast.error("Vui lòng đăng nhập")
          router.push("/pages/login")
          return
        }

        const ordersRef = ref(database, `orders/${user.id}`)

        const snapshot = await get(ordersRef)
        const orders = snapshot.val()

        if (!orders) {
          toast.error("Không tìm thấy đơn hàng")
          router.push("/")
          return
        }

        const orderKeys = Object.keys(orders)
        const latestOrderKey = orderKeys[orderKeys.length - 1]
        const latestOrderData = { ...orders[latestOrderKey], id: latestOrderKey }

        setLatestOrder(latestOrderData)
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error)
        toast.error("Không thể tải đơn hàng")
        router.push("/")
      }
    }

    fetchLatestOrder()
  }, [user, router])

  if (!latestOrder) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold text-green-600">
            Đặt Hàng Thành Công!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg mb-4">Cảm ơn bạn đã đặt hàng. </p>
          <p className="text-2xl font-bold mb-6">Mã đơn hàng của bạn là: #{latestOrder.id.slice(-6)}</p>
          <p className="text-gray-600">
            Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.
          </p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Giao Hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Tên:</strong> {latestOrder.fullName}</p>
            <p><strong>Số Điện Thoại:</strong> {latestOrder.phoneNumber}</p>
            <p><strong>Địa Chỉ:</strong> {`${latestOrder.shippingAddress.address}, 
              ${latestOrder.shippingAddress.ward}, 
              ${latestOrder.shippingAddress.district}, 
              ${latestOrder.shippingAddress.province}`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi Tiết Đơn Hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {latestOrder.items.map((item) => (
                <li key={item.id} className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fill
                      sizes="64px"
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Số Lượng: {item.quantity}</p>
                    <p className="text-sm font-medium">{item.price.toLocaleString("vi-VN")} ₫</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Tổng Phụ:</span>
            <span>{latestOrder.subtotal.toLocaleString("vi-VN")} ₫</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Phí Vận Chuyển:</span>
            <span>{latestOrder.shippingFee.toLocaleString("vi-VN")} ₫</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Tổng Cộng:</span>
            <span>{latestOrder.total.toLocaleString("vi-VN")} ₫</span>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-gray-600">
              <strong>Phương thức thanh toán:</strong> {
                latestOrder.paymentMethod === "cod" 
                  ? "Thanh toán khi nhận hàng (COD)" 
                  : latestOrder.paymentMethod === "vnpay"
                    ? "Thanh toán qua VNPAY"
                    : latestOrder.paymentMethod
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4 mt-8">
        <Button asChild>
          <Link href="/pages/products">
            Tiếp Tục Mua Hàng
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/pages/account/orders/${latestOrder.id}`}>
            Xem Chi Tiết Đơn Hàng
          </Link>
        </Button>
      </div>
    </div>
  )
}

