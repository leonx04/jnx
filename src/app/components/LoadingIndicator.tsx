'use client'

import { usePathname } from 'next/navigation'; // Hook dùng để lấy đường dẫn hiện tại của trang
import { Suspense, useEffect, useState } from 'react'; // Các hook và component cần thiết từ React

// Component LoadingIndicator hiển thị thanh tải khi có thay đổi route
const LoadingIndicator = () => {
    const pathname = usePathname(); // Lấy đường dẫn hiện tại từ Next.js
    const [isLoading, setIsLoading] = useState(false); // State để theo dõi trạng thái tải

    useEffect(() => {
        // Hàm gọi khi bắt đầu thay đổi route
        const handleStart = () => setIsLoading(true);

        // Hàm gọi khi thay đổi route hoàn thành hoặc gặp lỗi
        const handleComplete = () => setIsLoading(false);

        // Thêm sự kiện cho việc thay đổi route
        window.addEventListener('routeChangeStart', handleStart);
        window.addEventListener('routeChangeComplete', handleComplete);
        window.addEventListener('routeChangeError', handleComplete);

        // Cleanup sự kiện khi component unmount
        return () => {
            window.removeEventListener('routeChangeStart', handleStart);
            window.removeEventListener('routeChangeComplete', handleComplete);
            window.removeEventListener('routeChangeError', handleComplete);
        };
    }, []); // Chạy effect chỉ một lần khi component được mount

    useEffect(() => {
        // Reset trạng thái tải khi pathname thay đổi
        setIsLoading(false);
    }, [pathname]); // Khi pathname thay đổi, set isLoading về false

    if (!isLoading) return null; // Nếu không đang tải, không hiển thị gì

    return (
        // Thành phần hiển thị thanh tải trên cùng trang
        <div className="fixed top-0 left-0 w-full h-1 z-50">
            <div className="h-full bg-blue-500 animate-loading-bar"></div> {/* Thanh tải có màu xanh và hoạt ảnh */}
        </div>
    );
};

// Component bao bọc LoadingIndicator trong Suspense
const LoadingIndicatorWrapper = () => {
    return (
        <Suspense fallback={null}>
            <LoadingIndicator /> {/* Hiển thị LoadingIndicator khi đang tải */}
        </Suspense>
    );
};

export default LoadingIndicatorWrapper;
