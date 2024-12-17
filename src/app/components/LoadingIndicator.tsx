'use client'

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const LoadingIndicator = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleStart = () => setIsLoading(true);
        const handleComplete = () => setIsLoading(false);

        window.addEventListener('routeChangeStart', handleStart);
        window.addEventListener('routeChangeComplete', handleComplete);
        window.addEventListener('routeChangeError', handleComplete);

        return () => {
            window.removeEventListener('routeChangeStart', handleStart);
            window.removeEventListener('routeChangeComplete', handleComplete);
            window.removeEventListener('routeChangeError', handleComplete);
        };
    }, []);

    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    if (!isLoading) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-1 z-50">
            <div className="h-full bg-blue-500 animate-loading-bar"></div>
        </div>
    );
};

export default LoadingIndicator;

