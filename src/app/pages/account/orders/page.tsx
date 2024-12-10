'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/app/context/AuthContext'
import { database } from '@/firebaseConfig'
import { ref, get } from 'firebase/database'
import toast from 'react-hot-toast'
import Image from 'next/image'

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

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const { user } = useAuthContext()

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) {
        toast.error('Vui lòng đăng nhập để xem đơn hàng')
        return
      }

      try {
        const safeEmail = user.email.replace(/\./g, ',')
        const ordersRef = ref(database, `orders/${safeEmail}`)
        const snapshot = await get(ordersRef)
        
        if (snapshot.exists()) {
          const ordersData = snapshot.val()
          const ordersArray = Object.values(ordersData) as Order[]
          setOrders(ordersArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        } else {
          setOrders([])
        }
      } catch (error) {
        console.error('Lỗi tải đơn hàng:', error)
        toast.error('Không thể tải đơn hàng')
      }
    }

    fetchOrders()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <p className="text-gray-600 text-lg">Vui lòng đăng nhập để xem lịch sử đơn hàng.</p>
      </div>
    )
  }

  // Mapping order status to Vietnamese
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Lịch Sử Đơn Hàng</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <div 
              key={index} 
              className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
            >
              {/* Order Header */}
              <div className="bg-gray-100 px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Ngày đặt hàng: {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </p>
                  <p className="font-semibold text-sm">
                    Trạng thái: <span className={`
                      ${order.status === 'delivered' ? 'text-green-600' : 
                        order.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'}
                    `}>
                      {getStatusLabel(order.status)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6">
                {/* Shipping Information */}
                <div className="mb-6 border-b pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Thông Tin Giao Hàng</h3>
                  <div className="text-gray-600">
                    <p>{order.fullName}</p>
                    <p>{order.phoneNumber}</p>
                    <p>
                      {`${order.shippingAddress.address}, 
                        ${order.shippingAddress.ward}, 
                        ${order.shippingAddress.district}, 
                        ${order.shippingAddress.province}`}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6 border-b pb-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Sản Phẩm Đã Mua</h3>
                  <div className="space-y-4">
                    {order.items.map((item, itemIndex) => (
                      <div 
                        key={itemIndex} 
                        className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg"
                      >
                        <Image 
                          src={item.imageUrl} 
                          alt={item.name} 
                          width={80} 
                          height={80} 
                          className="object-cover rounded-md" 
                        />
                        <div className="flex-grow">
                          <p className="font-medium">{item.name}</p>
                          <div className="text-gray-600 text-sm">
                            <p>Số lượng: {item.quantity}</p>
                            <p>Đơn giá: {item.price.toLocaleString('vi-VN')} ₫</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="text-right">
                  <div className="space-y-2 text-gray-700">
                    <p>Tạm tính: {order.subtotal.toLocaleString('vi-VN')} ₫</p>
                    <p>Phí vận chuyển: {order.shippingFee.toLocaleString('vi-VN')} ₫</p>
                    <p className="font-bold text-xl text-blue-600">
                      Tổng cộng: {order.total.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}