'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PaymentResult() {
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const vnp_ResponseCode = searchParams.get('vnp_ResponseCode')
        if (vnp_ResponseCode === '00') {
            setStatus('success')
            setMessage('Thanh toán thành công!')
        } else {
            setStatus('error')
            setMessage('Thanh toán thất bại. Vui lòng thử lại.')
        }
    }, [searchParams])

    return (
        <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Kết quả thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin" />}
                    {status === 'success' && (
                        <svg
                            className="h-16 w-16 text-green-500 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    )}
                    {status === 'error' && (
                        <svg
                            className="h-16 w-16 text-red-500 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    )}
                    <p className="text-lg font-semibold mb-4">{message}</p>
                    <Link href="/dashboard">
                        <Button>Quay lại trang chủ</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}

