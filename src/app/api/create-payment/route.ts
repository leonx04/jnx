import { NextResponse } from 'next/server'
import crypto from 'crypto'

const VNP_TMNCODE = process.env.VNP_TMNCODE || ''
const VNP_HASHSECRET = process.env.VNP_HASHSECRET || ''
const VNP_URL = process.env.VNP_URL || ''

export async function POST(req: Request) {
    const body = await req.json()
    const { amount, orderInfo, orderId } = body

    const createDate = new Date().toISOString().split('T')[0].split('-').join('')
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

