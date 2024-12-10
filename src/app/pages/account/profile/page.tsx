'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useAuthContext } from '@/app/context/AuthContext'
import { database } from '@/firebaseConfig'
import { ref, get, set } from 'firebase/database'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserProfile {
  name: string
  email: string
  imageUrl: string
}

export default function AccountManagement() {
  const { user, updateUserImage } = useAuthContext() // Thêm updateUserImage
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '', imageUrl: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (user?.email) {
      const fetchProfile = async () => {
        const safeEmail = user.email.replace(/\./g, ',')
        const userRef = ref(database, `user/${safeEmail}`)
        const snapshot = await get(userRef)
        if (snapshot.exists()) {
          const userData = snapshot.val()
          setProfile({
            name: userData.name || '',
            email: userData.email,
            imageUrl: userData.imageUrl || ''
          })
        } else {
          // Initialize profile if it doesn't exist
          setProfile({
            name: user.name || '',
            email: user.email,
            imageUrl: user.imageUrl || ''
          })
        }
      }
      fetchProfile()
    }
  }, [user])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }

      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const safeEmail = user?.email?.replace(/\./g, ',')
      if (safeEmail) {
        let updatedProfile = { ...profile }

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
          updatedProfile = { ...updatedProfile, imageUrl: data.secure_url }
          
          // Cập nhật ảnh trong AuthContext
          updateUserImage(data.secure_url)
        }

        const userRef = ref(database, `user/${safeEmail}`)
        await set(userRef, updatedProfile)
        setProfile(updatedProfile)
        toast.success('Cập nhật thông tin thành công')
        setIsModalOpen(false)
        setPreviewImage(null)
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error)
      toast.error('Không thể cập nhật thông tin')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div>Vui lòng đăng nhập để xem trang này.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Quản lý tài khoản</h1>
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="flex justify-center mb-4">
            <Image
              src={profile.imageUrl || 'https://placehold.jp/100x100.png'}
              alt="Avatar"
              width={150}
              height={150}
              className="rounded-full"
              priority
            />
          </div>
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <p className="text-gray-600">{profile.email}</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Chỉnh sửa thông tin</Button>
            </DialogTrigger>
            <DialogContent>
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
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}