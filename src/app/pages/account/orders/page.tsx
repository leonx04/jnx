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
        toast.error('Please log in to view your orders')
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
        console.error('Error fetching orders:', error)
        toast.error('Failed to load orders')
      }
    }

    fetchOrders()
  }, [user])

  if (!user) {
    return <div>Please log in to view your orders.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>
      {orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        orders.map((order, index) => (
          <div key={index} className="mb-8 bg-white shadow-md rounded-lg p-6">
            <div className="mb-4">
              <p className="font-semibold">Order Date: {new Date(order.createdAt).toLocaleString()}</p>
              <p>Status: {order.status}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold">Shipping Information</h3>
              <p>{order.fullName}</p>
              <p>{order.phoneNumber}</p>
              <p>{`${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold">Order Items</h3>
              {order.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center mb-2">
                  <Image src={item.imageUrl} alt={item.name} width={50} height={50} className="mr-4" />
                  <div>
                    <p>{item.name}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: {item.price.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p>Subtotal: {order.subtotal.toLocaleString('vi-VN')} ₫</p>
              <p>Shipping Fee: {order.shippingFee.toLocaleString('vi-VN')} ₫</p>
              <p className="font-semibold">Total: {order.total.toLocaleString('vi-VN')} ₫</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

