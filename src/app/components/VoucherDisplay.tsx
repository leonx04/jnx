'use client';  // Chỉ ra rằng mã này chạy phía client (trình duyệt)

import { onValue, ref } from 'firebase/database';  // Nhập các hàm từ Firebase để thao tác với cơ sở dữ liệu
import { useEffect, useState } from 'react';  // Nhập các hook useEffect và useState từ React
import { database } from '../../firebaseConfig';  // Nhập cấu hình Firebase

// Định nghĩa interface cho Voucher (thẻ giảm giá)
interface Voucher {
    voucherCode: string;  // Mã thẻ giảm giá
    discountValue: number;  // Giá trị giảm giá
    discountType: 'percentage' | 'fixed';  // Kiểu giảm giá (theo phần trăm hoặc giá cố định)
    isExclusive: boolean;  // Kiểm tra xem thẻ giảm giá có phải là thẻ độc quyền không
    status: string;  // Trạng thái của thẻ giảm giá (ví dụ: 'active' hay 'inactive')
    startDate: string;  // Ngày bắt đầu hiệu lực thẻ giảm giá
    endDate: string;  // Ngày kết thúc hiệu lực thẻ giảm giá
}

export default function VoucherDisplay() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);  // Khởi tạo state để lưu trữ danh sách các thẻ giảm giá

    useEffect(() => {
        // Lấy tham chiếu đến bảng 'vouchers' trong Firebase
        const vouchersRef = ref(database, 'vouchers');

        // Đăng ký lắng nghe thay đổi trong dữ liệu thẻ giảm giá
        const unsubscribe = onValue(vouchersRef, (snapshot) => {
            if (snapshot.exists()) {
                const vouchersData = snapshot.val();  // Lấy dữ liệu từ Firebase
                const currentDate = new Date();  // Lấy ngày hiện tại
                // Lọc các thẻ giảm giá đang hoạt động (không độc quyền và trong thời gian hiệu lực)
                const activeVouchers = (Object.values(vouchersData) as Voucher[])
                    .filter((voucher) =>
                        !voucher.isExclusive &&
                        voucher.status === 'active' &&
                        new Date(voucher.startDate) <= currentDate &&  // Kiểm tra ngày bắt đầu
                        new Date(voucher.endDate) >= currentDate  // Kiểm tra ngày kết thúc
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
                setVouchers(activeVouchers);  // Cập nhật danh sách các thẻ giảm giá
            }
        });

        // Cleanup function để hủy đăng ký khi component bị hủy
        return () => unsubscribe();
    }, []);  // Chạy effect này chỉ một lần khi component được mount

    if (vouchers.length === 0) return null;  // Nếu không có thẻ giảm giá, không hiển thị gì

    // Hàm định dạng giá trị tiền tệ theo kiểu VNĐ
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
                    animation: 'marquee 40s linear infinite',  // Hiệu ứng marquee (cuộn chữ) trong 40 giây
                }}
            >
                {vouchers.concat(vouchers).map((voucher, index) => (  // Kết hợp 2 lần danh sách vouchers để tạo hiệu ứng cuộn
                    <span key={index} className="inline-block mx-4">
                        <span key={index} className="inline-block mx-4">
                            Thẻ giảm giá: {voucher.voucherCode} - Giảm{' '}
                            {voucher.discountType === 'percentage'  // Kiểm tra kiểu giảm giá là phần trăm hay giá cố định
                                ? `${voucher.discountValue}%`
                                : formatCurrency(voucher.discountValue)}  // Nếu là giá cố định, định dạng tiền tệ
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}
