'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { database } from "@/firebaseConfig"
import { ref, update } from 'firebase/database'

export default function PaymentResult() {
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const processPaymentResult = async () => {
            const vnp_ResponseCode = searchParams.get('vnp_ResponseCode')
            const vnp_TransactionStatus = searchParams.get('vnp_TransactionStatus')
            const vnp_TxnRef = searchParams.get('vnp_TxnRef') // Order ID
            const vnp_Amount = searchParams.get('vnp_Amount')
            const vnp_OrderInfo = searchParams.get('vnp_OrderInfo')

            // Map common VNPay error codes to user-friendly messages
            const errorMessages: { [key: string]: string } = {
                '01': 'Giao dịch đã tồn tại',
                '02': 'Merchant không hợp lệ',
                '03': 'Dữ liệu gửi sang không đúng định dạng',
                '04': 'Khởi tạo GD không thành công do Website đang bị tạm khóa',
                '05': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu quá số lần quy định.',
                '06': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu',
                '07': 'Giao dịch bị nghi ngờ là gian lận',
                '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
                '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
                '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
                '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
                '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu',
                '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
                '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
                '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
                '75': 'Ngân hàng thanh toán đang bảo trì',
                '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
                '99': 'Các lỗi khác'
            }

            if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
                setStatus('success')
                setMessage('Thanh toán thành công!')

                // Update order status in Firebase if order ID exists
                if (vnp_TxnRef) {
                    try {
                        const orderRef = ref(database, `orders/${vnp_TxnRef}`)
                        await update(orderRef, {
                            status: 'paid',
                            paymentDetails: {
                                amount: Number(vnp_Amount) / 100, // Convert from VNPay amount
                                transactionId: searchParams.get('vnp_TransactionNo'),
                                paymentTime: searchParams.get('vnp_PayDate'),
                                orderInfo: vnp_OrderInfo
                            }
                        })
                    } catch (error) {
                        console.error('Error updating order status:', error)
                    }
                }
            } else {
                setStatus('error')
                const errorMessage = errorMessages[vnp_ResponseCode || ''] || 'Thanh toán thất bại. Vui lòng thử lại.'
                setMessage(errorMessage)

                // Update order status to failed if order ID exists
                if (vnp_TxnRef) {
                    try {
                        const orderRef = ref(database, `orders/${vnp_TxnRef}`)
                        await update(orderRef, {
                            status: 'payment_failed',
                            paymentDetails: {
                                errorCode: vnp_ResponseCode,
                                errorMessage: errorMessage,
                                transactionId: searchParams.get('vnp_TransactionNo'),
                                paymentTime: searchParams.get('vnp_PayDate')
                            }
                        })
                    } catch (error) {
                        console.error('Error updating order status:', error)
                    }
                }
            }
        }

        processPaymentResult()
    }, [searchParams])

    return (
        <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Kết quả thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Đang xử lý kết quả thanh toán...</p>
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <p className="text-lg font-semibold text-green-600">{message}</p>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-2">
                            <XCircle className="h-16 w-16 text-red-500" />
                            <p className="text-lg font-semibold text-red-600">{message}</p>
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline">Trang chủ</Button>
                        </Link>
                        <Link href="/orders">
                            <Button>Xem đơn hàng</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
