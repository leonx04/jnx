// Import các icon từ FontAwesome
import { faArrowRight, faFire } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Import các module Firebase và các thư viện React cần thiết
import { onValue, ref } from 'firebase/database';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { database } from '../../lib/firebaseConfig'; // Cấu hình Firebase
import ProductCard from './ProductCard'; // Component hiển thị thông tin sản phẩm
import ProductCardSkeleton from './ProductCardSkeleton'; // Component skeleton khi tải dữ liệu

// Định nghĩa interface mô tả cấu trúc của sản phẩm
interface Product {
  id: string; // ID của sản phẩm
  name: string; // Tên sản phẩm
  price: number; // Giá sản phẩm
  salePrice: number; // Giá khuyến mãi
  imageUrl: string; // URL ảnh sản phẩm
  brand: string; // Thương hiệu
  bestSellerRank: number; // Thứ hạng bán chạy
  availableStock: number; // Số lượng còn lại trong kho
}

// Component hiển thị danh sách sản phẩm bán chạy
export default function BestSellers() {
  const [bestSellers, setBestSellers] = useState<Product[]>([]); // Trạng thái danh sách sản phẩm
  const [isLoading, setIsLoading] = useState(true); // Trạng thái tải dữ liệu

  useEffect(() => {
    // Tạo tham chiếu đến node 'products' trong Firebase Realtime Database
    const productsRef = ref(database, 'products');

    // Lắng nghe sự thay đổi dữ liệu trong node 'products'
    const unsubscribe = onValue(productsRef, (snapshot) => {
      setIsLoading(true); // Bật trạng thái đang tải
      const data = snapshot.val(); // Lấy dữ liệu từ snapshot
      if (data) {
        // Chuyển đổi dữ liệu thành mảng các sản phẩm
        const productsArray = Object.entries(data)
          .map(([id, product]) => ({
            id,
            ...(product as Omit<Product, 'id'>), // Đảm bảo mỗi sản phẩm có ID
          }))
          .filter((product) => product.bestSellerRank <= 4) // Lọc top 4 sản phẩm bán chạy
          .sort((a, b) => a.bestSellerRank - b.bestSellerRank); // Sắp xếp theo thứ hạng
        setBestSellers(productsArray); // Cập nhật danh sách sản phẩm bán chạy
      }
      setIsLoading(false); // Tắt trạng thái đang tải
    });

    // Cleanup function để huỷ đăng ký lắng nghe khi component unmount
    return () => unsubscribe();
  }, []);

  return (
    <section className="my-16">
      {/* Container chính của danh sách sản phẩm */}
      <div className="container-custom">
        {/* Phần tiêu đề và liên kết "Xem tất cả" */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold flex items-center">
            <FontAwesomeIcon icon={faFire} className="text-red-500 mr-4" /> {/* Icon lửa */}
            Sản phẩm bán chạy
          </h2>
          <Link href="/pages/products?sort=best-sellers" className="btn-primary">
            Xem tất cả
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" /> {/* Icon mũi tên */}
          </Link>
        </div>

        {/* Phần danh sách sản phẩm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading
            ? Array(4).fill(0).map((_, index) => <ProductCardSkeleton key={index} />) // Hiển thị skeleton khi đang tải
            : bestSellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} /> // Hiển thị từng sản phẩm
            ))}
        </div>
      </div>
    </section>
  );
}
