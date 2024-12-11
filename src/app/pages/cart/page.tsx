'use client'

import { useAuthContext } from '@/app/context/AuthContext'
import { database } from '@/firebaseConfig'
import { faMinus, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { onValue, ref, remove, update } from 'firebase/database'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  productId: string
}

interface FirebaseCartItem {
  [key: string]: {
    name: string
    price: number
    quantity: number
    imageUrl: string
    productId: string
  }
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (user?.id) {
      const cartRef = ref(database, `carts/${user.id}`)
      onValue(cartRef, (snapshot) => {
        const data = snapshot.val() as FirebaseCartItem | null
        if (data) {
          const items = Object.entries(data).map(([id, item]) => ({
            id,
            ...item,
            productId: item.productId || id,
          }))
          setCartItems(items)
        } else {
          setCartItems([])
        }
        setIsLoading(false)
      })
    } else {
      setCartItems([])
      setIsLoading(false)
    }
  }, [user])

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (user?.id) {
      const itemRef = ref(database, `carts/${user.id}/${itemId}`)
      update(itemRef, { quantity: newQuantity })
    }
  }

  const removeItem = (itemId: string) => {
    if (user?.id) {
      const itemRef = ref(database, `carts/${user.id}/${itemId}`)
      remove(itemRef)
      setSelectedItems(prev => prev.filter(id => id !== itemId))
      toast.success('Sản phẩm đã được xóa khỏi giỏ hàng')
    }
  }

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === cartItems.length ? [] : cartItems.map(item => item.id)
    )
  }

  const removeSelectedItems = () => {
    selectedItems.forEach(itemId => removeItem(itemId))
    setSelectedItems([])
    toast.success('Các sản phẩm đã chọn đã được xóa khỏi giỏ hàng')
  }

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const calculateSelectedTotal = () => {
    return calculateTotal(cartItems.filter(item => selectedItems.includes(item.id)))
  }

  const proceedToCheckout = () => {
    if (selectedItems.length > 0) {
      const selectedProducts = cartItems.filter(item => selectedItems.includes(item.id))
      localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts))
      router.push('/pages/checkout')
    } else {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để thanh toán')
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Đang tải...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Giỏ hàng của bạn</h1>
      {cartItems.length === 0 ? (
        <p>Giỏ hàng của bạn đang trống.</p>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.length === cartItems.length}
                onChange={toggleSelectAll}
                className="mr-2"
              />
              Chọn tất cả
            </label>
            {selectedItems.length > 0 && (
              <button
                onClick={removeSelectedItems}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
               <FontAwesomeIcon icon={faTrash} /> Xóa đã chọn
              </button>
            )}
          </div>
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center border-b border-gray-200 py-4 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="mr-4"
                />
                <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="object-cover rounded" />
                <div className="ml-4 flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <Link href={`/pages/products/${item.productId}`} className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">{item.price.toLocaleString('vi-VN')} ₫</p>
                  </div>
                  <div className="flex items-center mt-2 sm:mt-0">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="mx-2 text-gray-700">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-4 text-red-500 hover:text-red-700"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Tổng cộng (đã chọn):</span>
              <span className="text-2xl font-bold">{calculateSelectedTotal().toLocaleString('vi-VN')} ₫</span>
            </div>
            <button
              onClick={proceedToCheckout}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </>
      )}
    </div>
  )
}
