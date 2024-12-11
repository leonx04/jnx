"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { database } from "@/firebaseConfig"
import { ref, get } from "firebase/database"
import { useAuthContext } from "@/app/context/AuthContext"
import Image from "next/image"
import Link from "next/link"
import toast from "react-hot-toast"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string
}

interface Order {
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
        const latestOrderData = orders[latestOrderKey]

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
    <div className="container px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4 text-center">
          Đặt Hàng Thành Công!
        </h1>
        
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Thông Tin Giao Hàng</h2>
          <div className="space-y-1 text-sm sm:text-base">
            <p><strong>Tên:</strong> {latestOrder.fullName}</p>
            <p><strong>Số Điện Thoại:</strong> {latestOrder.phoneNumber}</p>
            <p>
              <strong>Địa Chỉ:</strong> {latestOrder.shippingAddress.address}, 
              {latestOrder.shippingAddress.ward}, 
              {latestOrder.shippingAddress.district}, 
              {latestOrder.shippingAddress.province}
            </p>
          </div>
        </div>

        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Chi Tiết Đơn Hàng</h2>
          {latestOrder.items.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center mb-3 space-x-4"
            >
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  fill
                  sizes="(max-width: 768px) 48px, 64px"
                  className="object-contain"
                />
              </div>
              <div className="flex-grow text-sm sm:text-base">
                <p className="font-semibold truncate max-w-[200px]">{item.name}</p>
                <div className="flex justify-between">
                  <p>Số Lượng: {item.quantity}</p>
                  <p>Giá: {item.price.toLocaleString("vi-VN")} ₫</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 text-sm sm:text-base">
          <div className="space-y-1">
            <p className="flex justify-between">
              <span>Tổng Phụ:</span> 
              <span>{latestOrder.subtotal.toLocaleString("vi-VN")} ₫</span>
            </p>
            <p className="flex justify-between">
              <span>Phí Vận Chuyển:</span> 
              <span>{latestOrder.shippingFee.toLocaleString("vi-VN")} ₫</span>
            </p>
            <p className="flex justify-between font-semibold text-lg">
              <span>Tổng Cộng:</span> 
              <span>{latestOrder.total.toLocaleString("vi-VN")} ₫</span>
            </p>
            <p className="mt-2">
              <strong>Phương thức thanh toán:</strong> {
                latestOrder.paymentMethod === "cod" 
                  ? "Thanh toán khi nhận hàng (COD)" 
                  : latestOrder.paymentMethod === "vnpay"
                    ? "Thanh toán qua VNPAY"
                    : latestOrder.paymentMethod
              }
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
          <Link 
            href="/pages/products" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
          >
            Tiếp Tục Mua Hàng
          </Link>
          <Link 
            href="/pages/account/orders" 
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center"
          >
            Xem Đơn Hàng
          </Link>
        </div>
      </div>
    </div>
  )
}