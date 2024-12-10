'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { database } from '@/firebaseConfig'
import { ref, get } from 'firebase/database'
import { useAuthContext } from '@/app/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
  createdAt: string
}

export default function OrderConfirmation() {
  const [latestOrder, setLatestOrder] = useState<Order | null>(null)
  const { user } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        // Kiểm tra người dùng đã đăng nhập chưa
        if (!user?.email) {
          toast.error('Vui lòng đăng nhập')
          router.push('/pages/login')
          return
        }

        // Thay thế dấu chấm bằng dấu phẩy để tương thích với Firebase
        const safeEmail = user.email.replace(/\./g, ',')
        const ordersRef = ref(database, `orders/${safeEmail}`)

        // Lấy snapshot của tất cả các đơn hàng
        const snapshot = await get(ordersRef)
        const orders = snapshot.val()

        if (!orders) {
          toast.error('Không tìm thấy đơn hàng')
          router.push('/')
          return
        }

        // Lấy đơn hàng mới nhất (đơn hàng cuối cùng)
        const orderKeys = Object.keys(orders)
        const latestOrderKey = orderKeys[orderKeys.length - 1]
        const latestOrderData = orders[latestOrderKey]

        setLatestOrder(latestOrderData)
      } catch (error) {
        console.error('Lỗi tải đơn hàng:', error)
        toast.error('Không thể tải đơn hàng')
        router.push('/')
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
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-green-600 mb-4 text-center">
          Đặt Hàng Thành Công!
        </h1>
        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Thông Tin Giao Hàng</h2>
          <p><strong>Tên:</strong> {latestOrder.fullName}</p>
          <p><strong>Số Điện Thoại:</strong> {latestOrder.phoneNumber}</p>
          <p>
            <strong>Địa Chỉ:</strong> {latestOrder.shippingAddress.address}, 
            {latestOrder.shippingAddress.ward}, 
            {latestOrder.shippingAddress.district}, 
            {latestOrder.shippingAddress.province}
          </p>
        </div>

        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Chi Tiết Đơn Hàng</h2>
          {latestOrder.items.map((item) => (
            <div key={item.id} className="flex items-center mb-3">
              <Image 
                src={item.imageUrl} 
                alt={item.name} 
                width={50} 
                height={50} 
                className="mr-4"
              />
              <div>
                <p className="font-semibold">{item.name}</p>
                <p>Số Lượng: {item.quantity}</p>
                <p>Giá: {item.price.toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="flex justify-between">
            <span>Tổng Phụ:</span> 
            <span>{latestOrder.subtotal.toLocaleString('vi-VN')} ₫</span>
          </p>
          <p className="flex justify-between">
            <span>Phí Vận Chuyển:</span> 
            <span>{latestOrder.shippingFee.toLocaleString('vi-VN')} ₫</span>
          </p>
          <p className="flex justify-between font-semibold text-lg">
            <span>Tổng Cộng:</span> 
            <span>{latestOrder.total.toLocaleString('vi-VN')} ₫</span>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link 
            href="/pages/products" 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mr-4"
          >
            Tiếp Tục Mua Hàng
          </Link>
          <Link 
            href="/pages/account/orders" 
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Xem Đơn Hàng
          </Link>
        </div>
      </div>
    </div>
  )
}