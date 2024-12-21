'use client';

import { useEffect, useState } from 'react';
import { get, ref } from 'firebase/database';
import { database } from '../../firebaseConfig';

interface Voucher {
    voucherCode: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    isExclusive: boolean;
}

export default function VoucherDisplay() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);

    useEffect(() => {
        const fetchVouchers = async () => {
            const vouchersRef = ref(database, 'vouchers');
            const snapshot = await get(vouchersRef);
            if (snapshot.exists()) {
                const vouchersData = snapshot.val();
                const publicVouchers = Object.values(vouchersData)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    // eslint-disable-next-line
                    .filter((voucher: any) => !voucher.isExclusive)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    // eslint-disable-next-line
                    .map((voucher: any) => ({
                        voucherCode: voucher.voucherCode,
                        discountValue: voucher.discountValue,
                        discountType: voucher.discountType,
                        isExclusive: voucher.isExclusive,
                    }));
                setVouchers(publicVouchers);
            }
        };
        fetchVouchers();
    }, []);

    if (vouchers.length === 0) return null;

    return (
        <div className="bg-black text-white py-2 overflow-hidden relative ">
            <div
                className="whitespace-nowrap inline-block animate-marquee"
                style={{
                    animation: 'marquee 20s linear infinite',
                }}
            >
                {vouchers.concat(vouchers).map((voucher, index) => (
                    <span key={index} className="inline-block mx-4">
                        Mã: {voucher.voucherCode} - Giảm{' '}
                        {voucher.discountType === 'percentage'
                            ? `${voucher.discountValue}%`
                            : `${voucher.discountValue.toLocaleString()}đ`}
                    </span>
                ))}
            </div>
        </div>
    );
}

