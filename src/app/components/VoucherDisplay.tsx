'use client';

import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { database } from '../../firebaseConfig';

interface Voucher {
    voucherCode: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    isExclusive: boolean;
    status: string;
    startDate: string;
    endDate: string;
}

export default function VoucherDisplay() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);

    useEffect(() => {
        const vouchersRef = ref(database, 'vouchers');
        const unsubscribe = onValue(vouchersRef, (snapshot) => {
            if (snapshot.exists()) {
                const vouchersData = snapshot.val();
                const currentDate = new Date();
                const activeVouchers = (Object.values(vouchersData) as Voucher[])
                    .filter((voucher) =>
                        !voucher.isExclusive &&
                        voucher.status === 'active' &&
                        new Date(voucher.startDate) <= currentDate &&
                        new Date(voucher.endDate) >= currentDate
                    )
                    .map((voucher) => ({
                        voucherCode: voucher.voucherCode,
                        discountValue: voucher.discountValue,
                        discountType: voucher.discountType,
                        isExclusive: voucher.isExclusive,
                        status: voucher.status,
                        startDate: voucher.startDate,
                        endDate: voucher.endDate,
                    }));
                setVouchers(activeVouchers);
            }
        });

        // Cleanup function to unsubscribe from the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    if (vouchers.length === 0) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="bg-black text-white py-2 overflow-hidden relative">
            <div
                className="whitespace-nowrap inline-block animate-marquee"
                style={{
                    animation: 'marquee 20s linear infinite',
                }}
            >
                {vouchers.concat(vouchers).map((voucher, index) => (
                    <span key={index} className="inline-block mx-4">
                        <span key={index} className="inline-block mx-4">
                            Thẻ giảm giá: {voucher.voucherCode} - Giảm{' '}
                            {voucher.discountType === 'percentage'
                                ? `${voucher.discountValue}%`
                                : formatCurrency(voucher.discountValue)}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}