'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/app/context/AuthContext'
import { database } from '@/firebaseConfig'
import { ref, get } from 'firebase/database'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon, UserIcon, MailIcon, KeyIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UserProfile {
  name: string
  email: string
  imageUrl: string
  id?: string
  password?: string
}

interface Order {
  id: string
  userId: string
  createdAt: string
  total: number
  shippingFee: number
  status: string
}

export default function AccountManagement() {
  const { user, updateUserInfo } = useAuthContext()
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '', imageUrl: '', id: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  const fetchUserProfile = useCallback(async () => {
    if (user?.id) {
      const userRef = ref(database, `user/${user.id}`)
      const snapshot = await get(userRef)
      if (snapshot.exists()) {
        const userData = snapshot.val()
        setProfile({
          name: userData.name || '',
          email: userData.email,
          imageUrl: userData.imageUrl || '',
          id: user.id,
          password: userData.password || ''
        })
      }
    }
  }, [user])

  const fetchOrders = useCallback(async () => {
    if (user?.email) {
      const ordersRef = ref(database, 'orders')
      const snapshot = await get(ordersRef)
      if (snapshot.exists()) {
        const ordersData = snapshot.val()
        const userOrders = Object.entries(ordersData)
          .flatMap(([email, orders]) => {
            if (email === user.email.replace(/\./g, ',')) {
              return Object.entries(orders as { [key: string]: Order }).map(([id, order]) => ({
                ...order,
                id,
              }))
            }
            return []
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(userOrders.slice(0, 10)) 
      }
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchOrders()
    }
  }, [user, fetchUserProfile, fetchOrders])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }

      reader.readAsDataURL(file)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (!profile.name.trim()) {
        throw new Error('Tên không được để trống')
      }

      let updatedProfile: UserProfile = { ...profile }

      if (previewImage) {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: previewImage,
            oldImageUrl: profile.imageUrl,
          }),
        })

        if (!response.ok) {
          throw new Error('Không thể tải lên hình ảnh')
        }

        const data = await response.json()
        updatedProfile.imageUrl = data.secure_url
      }

      await updateUserInfo(updatedProfile)
      setProfile(updatedProfile)
      toast.success('Cập nhật thông tin thành công')
      setIsModalOpen(false)
      setPreviewImage(null)
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error)
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật thông tin')
    } finally {
      setIsLoading(false)
    }
  }, [profile, previewImage, updateUserInfo])

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

  if (!user) {
    return <div className="text-center py-10">Vui lòng đăng nhập để xem trang này.</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Quản lý tài khoản</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Image
                src={profile.imageUrl || 'https://placehold.jp/150x150.png'}
                alt="Avatar"
                width={150}
                height={150}
                className="rounded-full"
                priority
              />
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button>Chỉnh sửa thông tin</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa thông tin tài khoản</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="avatar">Ảnh đại diện</Label>
                      <div className="flex items-center space-x-4">
                        <Image
                          src={previewImage || profile.imageUrl || 'https://placehold.jp/100x100.png'}
                          alt="Avatar Preview"
                          width={100}
                          height={100}
                          className="rounded-full"
                        />
                        <Input
                          type="file"
                          id="avatar"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Tên</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          value={profile.name}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          type="email"
                          id="email"
                          name="email"
                          value={profile.email}
                          className="pl-10"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mật khẩu</Label>
                      <div className="relative">
                        <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={profile.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                        >
                          {showPassword ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Đơn hàng gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p>Bạn chưa có đơn hàng nào.</p>
            ) : (
              <ul className="space-y-4">
                {orders.map((order) => (
                  <li key={order.id} className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Đơn hàng #{order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-600">
                          Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="text-sm">
                          Trạng thái: <span className={`font-semibold ${
                            order.status === 'delivered' ? 'text-green-600' : 
                            order.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          Tổng tiền: {order.total.toLocaleString('vi-VN')} ₫
                        </p>
                        <p className="text-sm">
                          Phí vận chuyển: {order.shippingFee.toLocaleString('vi-VN')} ₫
                        </p>
                        <Link href={`/pages/account/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="mt-2">
                            Xem chi tiết
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

