import { database } from "@/lib/firebaseConfig"
import { push, ref, set } from "firebase/database"
import { NextResponse } from 'next/server'
import { VNPay } from 'vnpay'

const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMNCODE || '',
    secureSecret: process.env.VNP_HASHSECRET || '',
    vnpayHost: process.env.VNP_URL || '',
})

const createNotification = async (orderId: string, message: string) => {
    const notificationsRef = ref(database, 'notifications');
    const newNotificationRef = push(notificationsRef);
    const newNotification = {
        orderId,
        message,
        createdAt: new Date().toISOString(),
        seen: false,
    };
    await set(newNotificationRef, newNotification);
};

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { amount, orderInfo, orderId, userId, order } = body

        const ipAddr = req.headers.get('x-forwarded-for') || '127.0.0.1'

        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: amount,
            vnp_IpAddr: ipAddr,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pages/order-confirmation`,
        })

        if (!paymentUrl) {
            throw new Error('Không thể tạo URL thanh toán')
        }

        // Store the order in the database
        const orderRef = ref(database, `orders/${userId}/${orderId}`);
        await set(orderRef, order);

        // Create a notification for the new order
        await createNotification(orderId, `Đơn hàng mới #${orderId.slice(-6)} từ ${order.fullName}`);

        return NextResponse.json({ paymentUrl })
    } catch (error) {
        console.error('Payment creation error:', error)
        return NextResponse.json(
            { error: 'Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}

