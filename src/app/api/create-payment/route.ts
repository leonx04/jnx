import { NextResponse } from 'next/server'
import crypto from 'crypto'

const VNP_TMNCODE = process.env.VNP_TMNCODE || ''
const VNP_HASHSECRET = process.env.VNP_HASHSECRET || ''
const VNP_URL = process.env.VNP_URL || ''

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { amount, orderInfo, orderId } = body

        // Validate required environment variables
        if (!VNP_TMNCODE || !VNP_HASHSECRET || !VNP_URL) {
            throw new Error('Missing required VNPay configuration')
        }

        // Format date as YYYYMMDDHHmmss
        const now = new Date()
        const createDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

        const ipAddr = req.headers.get('x-forwarded-for') || '127.0.0.1'

        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: VNP_TMNCODE,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_Amount: amount * 100,
            vnp_ReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment-result`,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        }

        const sortedParams = sortObject(vnpParams)
        const signData = Object.keys(sortedParams)
            .map(key => `${key}=${sortedParams[key]}`)
            .join('&')

        const hmac = crypto.createHmac('sha512', VNP_HASHSECRET)
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

        const finalParams: { [key: string]: any } = {
            ...sortedParams,
            vnp_SecureHash: signed,
        }

        const queryString = Object.keys(finalParams)
            .map(key => `${key}=${encodeURIComponent(finalParams[key])}`)
            .join('&')

        const paymentUrl = `${VNP_URL}?${queryString}`

        return NextResponse.json({ paymentUrl })
    } catch (error) {
        console.error('Payment creation error:', error)
        return NextResponse.json(
            { error: 'Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}

function sortObject(obj: Record<string, any>) {
    const sorted: Record<string, any> = {}
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
        if (obj.hasOwnProperty(key)) {
            sorted[key] = obj[key]
        }
    }

    return sorted
}

