'use client';

import { faArrowRight, faCalendarPlus, faDollarSign, faHeadset, faMoneyBillWave, faShippingFast, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { onValue, ref } from 'firebase/database';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { database } from '../firebaseConfig';
import BestSellers from './components/BestSellers';
import Carousel from './components/Carousel';
import CustomerReviews from './components/CustomerReviews';
import ProductCard from './components/ProductCard';
import ProductCardSkeleton from './components/ProductCardSkeleton';
import TennisTips from './components/TennisTips';

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  description: string;
  category: string;
  brand: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  availableStock: number;
  yearReleased: number;
}


export default function Home() {
  const [newestProducts, setNewestProducts] = useState<Product[]>([]);
  const [mostDiscountedProducts, setMostDiscountedProducts] = useState<Product[]>([]);
  const [cheapestProducts, setCheapestProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      setIsLoading(true);
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]) => ({
          id,
          ...(product as Omit<Product, 'id'>),
        }));

        setNewestProducts(productsArray.sort((a, b) => b.yearReleased - a.yearReleased).slice(0, 4));
        setMostDiscountedProducts(
          productsArray
            .filter((product) => product.salePrice && product.salePrice < product.price)
            .sort((a, b) => (b.price - b.salePrice) / b.price - (a.price - a.salePrice) / a.price)
            .slice(0, 4)
        );
        setCheapestProducts(productsArray.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price)).slice(0, 4));
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const slides = [
    {
      image: 'https://i.pinimg.com/originals/45/c1/fc/45c1fcf4aaae94a8ab0015e186070d22.gif',
      title: 'Chào Mừng Đến JNX Tennis Store',
      description: 'Trải nghiệm mua sắm tennis chuyên nghiệp',
    },
    {
      image: 'https://i.pinimg.com/originals/d4/29/3a/d4293acedaafb6a8447a9e57e079e1b3.gif',
      title: 'Siêu Khuyến Mãi Mùa Đông',
      description: 'Giảm giá lên đến 50% cho các sản phẩm',
    },
    {
      image: 'https://i.pinimg.com/originals/b1/18/ce/b118cec88f52f6f2bd1edc1808056c10.gif',
      title: 'Miễn Phí Vận Chuyển',
      description: 'Cho đơn hàng trên 2,000,000 đ',
    },
  ];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line
  const ProductSection = ({ title, icon, iconColor, products, linkHref }: { title: string; icon: any; iconColor: string; products: Product[]; linkHref: string }) => (
    <section className="my-16">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-2xl font-bold flex items-center ${iconColor}`}>
            <FontAwesomeIcon icon={icon} className="mr-4" />
            {title}
          </h2>
          <Link href={linkHref} className="btn-primary">
            Xem tất cả
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading
            ? Array(4).fill(0).map((_, index) => <ProductCardSkeleton key={index} />)
            : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </div>
    </section>
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line
  const FeatureCard = ({ icon, title, description }: { icon: any; title: string; description: string }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
      <FontAwesomeIcon icon={icon} className="text-4xl text-black mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">

      <Carousel slides={slides} />

      <BestSellers />

      <ProductSection
        title="Sản phẩm mới nhất"
        icon={faCalendarPlus}
        iconColor="text-black"
        products={newestProducts}
        linkHref="/pages/products?sort=newest"
      />

      <section className="my-16 bg-gray-100 py-12">
        <div className="container-custom">
          <ProductSection
            title="Sản phẩm khuyến mãi nhiều nhất"
            icon={faTag}
            iconColor="text-black"
            products={mostDiscountedProducts}
            linkHref="/pages/products?sort=discount"
          />
        </div>
      </section>

      <ProductSection
        title="Sản phẩm giá tốt nhất"
        icon={faDollarSign}
        iconColor="text-black"
        products={cheapestProducts}
        linkHref="/pages/products?sort=price-asc"
      />

      <section className="my-16 bg-gray-100 py-12">
        <div className="container-custom">
          <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard icon={faShippingFast} title="Giao hàng nhanh chóng" description="Miễn phí giao hàng cho đơn hàng trên 2 triệu đồng" />
            <FeatureCard icon={faMoneyBillWave} title="Đảm bảo hoàn tiền" description="30 ngày đổi trả miễn phí" />
            <FeatureCard icon={faHeadset} title="Hỗ trợ 24/7" description="Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ" />
          </div>
        </div>
      </section>

      <CustomerReviews />

      <TennisTips />

      <section className="my-16 bg-black py-12 text-white">
        <div className="container-custom">
          <h2 className="section-title text-white">Đăng Ký Nhận Tin</h2>
          <p className="text-center mb-6 max-w-2xl mx-auto">
            Đăng ký để nhận thông tin mới nhất về sản phẩm, khuyến mãi độc quyền và các sự kiện tennis
          </p>
          <form className="max-w-xl mx-auto flex flex-col md:flex-row gap-4" netlify>
            <input
              type="email"
              placeholder="Nhập địa chỉ email của bạn"
              className="flex-grow p-3 rounded-lg border border-white bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            <button
              type="submit"
              className="bg-white text-black font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-200"
            >
              Đăng Ký Ngay
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

