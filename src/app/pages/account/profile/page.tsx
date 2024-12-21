'use client'

import { useAuthContext } from '@/app/context/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { database } from '@/firebaseConfig'
import bcrypt from 'bcryptjs'
import { get, ref } from 'firebase/database'
import { CalendarIcon, CreditCardIcon, EyeIcon, EyeOffIcon, GiftIcon, KeyIcon, MailIcon, PackageIcon, UserIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface UserProfile {
  name: string
  email: string
  imageUrl: string
  id?: string
  password?: string
  createdAt?: string
}

interface Order {
  id: string
  userId: string
  createdAt: string
  total: number
  shippingFee: number
  status: string
}

interface Voucher {
  id: string
  voucherCode: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  startDate: string
  endDate: string
  minOrderValue: number
  maxDiscountAmount: number
  usageLimit: number
  usedCount: number
  status: 'active' | 'inactive' | 'expired' | 'incoming'
}

export default function AccountManagement() {
  const { user, updateUserInfo } = useAuthContext() as { user: UserProfile, updateUserInfo: (profile: UserProfile) => Promise<void> }
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '', imageUrl: '', id: '', password: '' })
  const [encryptedPassword, setEncryptedPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)

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
          password: '', // Initialize with an empty string
          createdAt: userData.createdAt // Added createdAt
        })
        setEncryptedPassword(userData.password || '')
      }
    }
  }, [user])

  const fetchOrders = useCallback(async () => {
    if (user?.id) {
      const ordersRef = ref(database, `orders/${user.id}`)
      const snapshot = await get(ordersRef)
      if (snapshot.exists()) {
        const ordersData = snapshot.val()
        const userOrders = Object.entries(ordersData)
          .map(([id, order]) => ({
            ...(order as Order),
            id
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(userOrders)
      }
    }
  }, [user])

  const fetchVouchers = useCallback(async () => {
    if (user?.id) {
      const vouchersRef = ref(database, 'vouchers')
      const snapshot = await get(vouchersRef)
      if (snapshot.exists()) {
        const vouchersData = snapshot.val()
        const userVouchers = Object.entries(vouchersData)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          .filter(([_, voucher]: [string, any]) =>
            voucher.userId &&
            voucher.userId.includes(user.id) &&
            (voucher.status === 'active' || voucher.status === 'incoming')
          )
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          .map(([id, voucher]: [string, any]) => ({
            ...voucher,
            id
          }))
        setVouchers(userVouchers)
      }
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchOrders()
      fetchVouchers()
    }
  }, [user, fetchUserProfile, fetchOrders, fetchVouchers])

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

      const updatedProfile: UserProfile = { ...profile, createdAt: user?.createdAt }

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

      // Check if the password has been changed
      if (profile.password && profile.password !== '') {
        const salt = await bcrypt.genSalt(10)
        updatedProfile.password = await bcrypt.hash(profile.password, salt)
      } else {
        // If password hasn't changed, use the existing encrypted password
        updatedProfile.password = encryptedPassword
      }

      await updateUserInfo({ ...updatedProfile, createdAt: user?.createdAt })
      setProfile(updatedProfile)
      setEncryptedPassword(updatedProfile.password)
      toast.success('Cập nhật thông tin thành công')
      setIsModalOpen(false)
      setPreviewImage(null)
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error)
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật thông tin')
    } finally {
      setIsLoading(false)
    }
  }, [profile, previewImage, updateUserInfo, encryptedPassword, user])

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

  const getVoucherStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động'
      case 'inactive':
        return 'Không hoạt động'
      case 'expired':
        return 'Đã hết hạn'
      case 'incoming':
        return 'Sắp diễn ra'
      default:
        return status
    }
  }

  const handleVoucherClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher)
    setIsVoucherModalOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  if (!user) {
    return <div className="text-center py-10">Vui lòng đăng nhập để xem trang này.</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Quản lý tài khoản</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Account Information Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="mr-2" />
              Thông tin cá nhân
            </CardTitle>
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
                          placeholder="Nhập mật khẩu mới để thay đổi"
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

        {/* Exclusive Vouchers Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GiftIcon className="mr-2" />
              Voucher đặc quyền của bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vouchers.length === 0 ? (
              <p className="text-center text-gray-500">Bạn chưa có voucher đặc quyền nào.</p>
            ) : (
              <div className="space-y-4">
                {vouchers.map((voucher) => (
                  <div key={voucher.id} className="border rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition duration-200" onClick={() => handleVoucherClick(voucher)}>
                    <h3 className="font-semibold text-lg">{voucher.voucherCode}</h3>
                    <p className="text-sm text-gray-600 mb-2">{voucher.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-green-600">
                        {voucher.discountType === 'percentage' ? `Giảm ${voucher.discountValue}%` : `Giảm ${formatCurrency(voucher.discountValue)}`}
                      </span>
                      <span className="text-gray-500 flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        HSD: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order History Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PackageIcon className="mr-2" />
              Lịch sử đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-center text-gray-500">Bạn chưa có đơn hàng nào.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Đơn hàng #{order.id.slice(-6)}</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <CalendarIcon className="inline-block w-4 h-4 mr-1" />
                      Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span>
                        <CreditCardIcon className="inline-block w-4 h-4 mr-1" />
                        Tổng tiền: {formatCurrency(order.total)}
                      </span>
                      <Link href={`/pages/account/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chi tiết voucher</DialogTitle>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedVoucher.voucherCode}</h3>
                <p className="text-gray-600">{selectedVoucher.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Loại giảm giá:</p>
                  <p>{selectedVoucher.discountType === 'percentage' ? 'Phần trăm' : 'Cố định'}</p>
                </div>
                <div>
                  <p className="font-medium">Giá trị giảm:</p>
                  <p>{selectedVoucher.discountType === 'percentage' ? `${selectedVoucher.discountValue}%` : formatCurrency(selectedVoucher.discountValue)}</p>
                </div>
                <div>
                  <p className="font-medium">Ngày bắt đầu:</p>
                  <p>{new Date(selectedVoucher.startDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="font-medium">Ngày kết thúc:</p>
                  <p>{new Date(selectedVoucher.endDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="font-medium">Giá trị đơn hàng tối thiểu:</p>
                  <p>{formatCurrency(selectedVoucher.minOrderValue)}</p>
                </div>
                <div>
                  <p className="font-medium">Giảm giá tối đa:</p>
                  <p>{formatCurrency(selectedVoucher.maxDiscountAmount)}</p>
                </div>
                <div>
                  <p className="font-medium">Số lần sử dụng còn lại:</p>
                  <p>{selectedVoucher.usageLimit - selectedVoucher.usedCount}</p>
                </div>
                <div>
                  <p className="font-medium">Trạng thái:</p>
                  <p>{getVoucherStatusLabel(selectedVoucher.status)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

