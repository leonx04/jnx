import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

cloudinary.config({ 
  cloud_name: 'dfi8tvwsf', 
  api_key: '682937843282593', 
  api_secret: 'OsgYgvw6qliYc_D6zE_fwQxmMc0' 
})

export async function POST(request: Request) {
  try {
    const { image, oldImageUrl } = await request.json()

    // Delete old image if it exists
    if (oldImageUrl) {
      const oldPublicId = oldImageUrl.split('/').pop()?.split('.')[0]
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId)
      }
    }

    // Upload new image
    const uploadResponse = await cloudinary.uploader.upload(image, {
      upload_preset: 'Tennis', // Using the correct upload preset
    })

    return NextResponse.json({ secure_url: uploadResponse.secure_url })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { message: 'Error uploading image' },
      { status: 500 }
    )
  }
}

