import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

// Cấu hình Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: Request) {
  try {
    const { image, oldImageUrl } = await request.json()

    // Xóa ảnh cũ nếu tồn tại
    if (oldImageUrl) {
      const oldPublicId = oldImageUrl.split('/').pop()?.split('.')[0]
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId)
      }
    }

    // Tải ảnh mới lên
    const uploadResponse = await cloudinary.uploader.upload(image, {
      upload_preset: 'Tennis', // Sử dụng upload preset chính xác
    })

    return NextResponse.json({ secure_url: uploadResponse.secure_url })
  } catch (error) {
    console.error('Lỗi tải lên hình ảnh:', error)
    return NextResponse.json(
      { message: 'Lỗi tải lên hình ảnh' },
      { status: 500 }
    )
  }
}