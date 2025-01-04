"use client"

import { useAuthContext } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { database } from "@/firebaseConfig"
import { push, ref, serverTimestamp } from "firebase/database"
import { AlertCircle, Minus, Plus, Upload, X } from 'lucide-react'
import Image from "next/image"
import { useCallback, useRef, useState } from "react"
import { toast } from "react-hot-toast"

interface RefundRequestProps {
    orderId: string
    items: {
        id: string
        name: string
        quantity: number
        price: number
        imageUrl: string
    }[]
    onRefundRequested: () => void
}

interface RefundItem {
    id: string
    quantity: number
}

interface ImagePreview {
    file: File
    preview: string
    uploading?: boolean
    progress?: number
    error?: string
    url?: string
}

const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'Tennis') // Use the correct upload preset

    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`)
        }

        const data = await response.json()
        return data.secure_url
    } catch (error) {
        console.error('Error uploading image:', error)
        throw error
    }
}

export function RefundRequest({ orderId, items, onRefundRequested }: RefundRequestProps) {
    const { user } = useAuthContext()
    const [selectedItems, setSelectedItems] = useState<RefundItem[]>([])
    const [refundReason, setRefundReason] = useState("")
    const [otherReason, setOtherReason] = useState("")
    const [description, setDescription] = useState("")
    const [images, setImages] = useState<ImagePreview[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadingImages, setUploadingImages] = useState<boolean[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleItemToggle = (itemId: string, maxQuantity: number) => {
        setSelectedItems(prev => {
            const existingItem = prev.find(item => item.id === itemId)
            if (existingItem) {
                return prev.filter(item => item.id !== itemId)
            } else {
                return [...prev, { id: itemId, quantity: 1 }]
            }
        })
    }

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        setSelectedItems(prev =>
            prev.map(item =>
                item.id === itemId
                    ? { ...item, quantity: Math.max(1, Math.min(newQuantity, items.find(i => i.id === itemId)?.quantity || 1)) }
                    : item
            )
        )
    }

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newPreviews = Array.from(files).map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }))

        setImages(prev => [...prev, ...newPreviews].slice(0, 5))
        setUploadingImages(prev => [...prev, ...new Array(newPreviews.length).fill(false)])
    }, [])

    const removeImage = useCallback((index: number) => {
        if (isSubmitting) return
        setImages(prev => {
            const newImages = [...prev]
            URL.revokeObjectURL(newImages[index].preview)
            newImages.splice(index, 1)
            return newImages
        })
        setUploadingImages(prev => {
            const newUploading = [...prev]
            newUploading.splice(index, 1)
            return newUploading
        })
    }, [isSubmitting])


    const uploadImages = async (images: ImagePreview[]): Promise<string[]> => {
        const uploadedUrls: string[] = []

        for (let i = 0; i < images.length; i++) {
            const image = images[i]
            try {
                setUploadingImages(prev => prev.map((uploading, index) => index === i ? true : uploading))

                const url = await uploadImage(image.file)

                uploadedUrls.push(url)
                setImages(prev =>
                    prev.map((img, index) =>
                        index === i ? { ...img, url } : img
                    )
                )
            } catch (error) {
                console.error(`Error uploading image ${i + 1}:`, error)
                toast.error(`Không thể tải lên ảnh ${i + 1}`)
            } finally {
                setUploadingImages(prev => prev.map((uploading, index) => index === i ? false : uploading))
            }
        }

        return uploadedUrls
    }

    const createNotification = async (message: string) => {
        if (!user) return
        const notificationsRef = ref(database, 'notifications')
        await push(notificationsRef, {
            orderId,
            message,
            createdAt: serverTimestamp(),
            seen: false
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error("Vui lòng đăng nhập để gửi yêu cầu hoàn tiền")
            return
        }

        if (selectedItems.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm để hoàn tiền")
            return
        }

        if (!refundReason) {
            toast.error("Vui lòng chọn lý do hoàn tiền")
            return
        }

        if (refundReason === "other" && !otherReason.trim()) {
            toast.error("Vui lòng nhập lý do hoàn tiền khác")
            return
        }

        if (images.length === 0) {
            toast.error("Vui lòng tải lên ít nhất một ảnh")
            return
        }

        try {
            setIsSubmitting(true)

            const uploadedUrls = await uploadImages(images)

            const refundRequestRef = ref(database, "refundRequests")
            await push(refundRequestRef, {
                userId: user.id,
                orderId,
                items: selectedItems,
                reason: refundReason === "other" ? otherReason : refundReason,
                description,
                images: uploadedUrls,
                status: "pending",
                createdAt: serverTimestamp(),
            })

            await createNotification(`Yêu cầu hoàn tiền mới cho đơn hàng #${orderId.slice(-6)}`)
            toast.success("Yêu cầu hoàn tiền đã được gửi thành công")
            onRefundRequested()
        } catch (error) {
            console.error("Error submitting refund request:", error)
            toast.error("Không thể gửi yêu cầu hoàn tiền. Vui lòng thử lại sau.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Yêu Cầu Hoàn Tiền</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium mb-4">Chọn sản phẩm cần hoàn tiền:</h3>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <Checkbox
                                        id={`item-${item.id}`}
                                        checked={selectedItems.some(i => i.id === item.id)}
                                        onCheckedChange={() => handleItemToggle(item.id, item.quantity)}
                                        className="mt-1"
                                    />
                                    <div className="flex-grow flex items-start space-x-4">
                                        <div className="w-24 h-24 relative flex-shrink-0">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                layout="fill"
                                                objectFit="contain"
                                                className="rounded-md"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <Label htmlFor={`item-${item.id}`} className="font-medium">
                                                {item.name}
                                            </Label>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {item.quantity} x {item.price.toLocaleString("vi-VN")}₫
                                            </p>
                                            {selectedItems.some(i => i.id === item.id) && (
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <Label htmlFor={`quantity-${item.id}`} className="text-sm font-medium">
                                                        Số lượng hoàn trả:
                                                    </Label>
                                                    <div className="flex items-center">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleQuantityChange(item.id, (selectedItems.find(i => i.id === item.id)?.quantity || 1) - 1)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <Input
                                                            id={`quantity-${item.id}`}
                                                            type="number"
                                                            min={1}
                                                            max={item.quantity}
                                                            value={selectedItems.find(i => i.id === item.id)?.quantity || 1}
                                                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                                            className="w-14 h-8 text-center mx-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleQuantityChange(item.id, (selectedItems.find(i => i.id === item.id)?.quantity || 1) + 1)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-2">Lý do hoàn tiền:</h3>
                        <RadioGroup value={refundReason} onValueChange={setRefundReason} className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="defective" id="defective" />
                                <Label htmlFor="defective">Sản phẩm bị lỗi</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="not_as_described" id="not_as_described" />
                                <Label htmlFor="not_as_described">Sản phẩm không đúng mô tả</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="wrong_item" id="wrong_item" />
                                <Label htmlFor="wrong_item">Nhận sai sản phẩm</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="other" />
                                <Label htmlFor="other">Lý do khác</Label>
                            </div>
                        </RadioGroup>
                        {refundReason === "other" && (
                            <Textarea
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                placeholder="Nhập lý do hoàn tiền khác"
                                className="mt-2"
                            />
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description" className="text-lg font-medium">Mô tả chi tiết:</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả chi tiết về vấn đề của sản phẩm"
                            className="mt-2"
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label htmlFor="images" className="text-lg font-medium mb-2 block">
                            Hình ảnh sản phẩm (tối đa 5 ảnh):
                        </Label>
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="images"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Nhấp để tải lên</span> hoặc kéo và thả
                                    </p>
                                    <p className="text-xs text-gray-500">PNG, JPG (Tối đa 5 ảnh)</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="images"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={images.length >= 5}
                                />
                            </label>
                        </div>
                        {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((image, index) => (
                                    <div key={index} className="relative">
                                        <div className="relative w-full h-24">
                                            <Image
                                                src={image.preview}
                                                alt={`Preview image ${index + 1}`}
                                                layout="fill"
                                                objectFit="cover"
                                                className="rounded-md"
                                            />
                                            {uploadingImages[index] && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                                                    <div className="w-full px-4">
                                                        <Progress value={undefined} className="w-full" />
                                                    </div>
                                                </div>
                                            )}
                                            {image.error && (
                                                <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center rounded-md">
                                                    <p className="text-white text-xs px-2 text-center">{image.error}</p>
                                                </div>
                                            )}
                                        </div>
                                        {!isSubmitting && (
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/3 -translate-y-1/3"
                                                disabled={isSubmitting}
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {isSubmitting && (
                            <p className="mt-2 text-sm text-yellow-500 flex items-center">
                                <AlertCircle size={16} className="mr-2" />
                                Đang gửi yêu cầu, không thể xóa ảnh trong quá trình này
                            </p>
                        )}
                        {images.length > 0 && (
                            <p className="mt-2 text-sm text-red-500 flex items-center">
                                <AlertCircle size={16} className="mr-2" />
                                Không thể xóa ảnh sau khi đã tải lên để tránh xung đột dữ liệu
                            </p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting || images.length === 0}>
                        {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu hoàn tiền"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

