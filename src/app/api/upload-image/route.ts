// route.ts
import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: Request) {
  try {
    // Kiểm tra Content-Type để xác định loại request
    const contentType = request.headers.get('content-type') || ''

    let imageToUpload: string | undefined
    let oldImageUrl: string | undefined

    // Xử lý FormData (cho upload file)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json(
          { message: 'Không tìm thấy file' },
          { status: 400 }
        )
      }

      // Convert File to base64
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      imageToUpload = `data:${file.type};base64,${buffer.toString('base64')}`
      oldImageUrl = formData.get('oldImageUrl') as string | undefined
    }
    // Xử lý JSON (cho upload base64 image)
    else if (contentType.includes('application/json')) {
      const { image, oldImageUrl: oldUrl } = await request.json()
      imageToUpload = image
      oldImageUrl = oldUrl
    } else {
      return NextResponse.json(
        { message: 'Content-Type không hợp lệ' },
        { status: 400 }
      )
    }

    if (!imageToUpload) {
      return NextResponse.json(
        { message: 'Không tìm thấy dữ liệu hình ảnh' },
        { status: 400 }
      )
    }

    // Xóa ảnh cũ nếu có
    if (oldImageUrl) {
      try {
        const oldPublicId = oldImageUrl.split('/').pop()?.split('.')[0]
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId)
        }
      } catch (error) {
        console.error('Lỗi khi xóa ảnh cũ:', error)
        // Tiếp tục xử lý ngay cả khi xóa ảnh cũ thất bại
      }
    }

    // Upload ảnh mới
    const uploadResponse = await cloudinary.uploader.upload(imageToUpload, {
      upload_preset: 'Tennis',
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