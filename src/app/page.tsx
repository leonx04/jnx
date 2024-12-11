'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faHeadset,
  faMoneyBillWave,
  faShippingFast,
  faCalendarPlus,
  faTag,
  faDollarSign,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Carousel from './components/Carousel';
import ProductCard from './components/ProductCard';
import { database } from '../firebaseConfig';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [newestProducts, setNewestProducts] = useState<Product[]>([]);
  const [mostDiscountedProducts, setMostDiscountedProducts] = useState<Product[]>([]);
  const [cheapestProducts, setCheapestProducts] = useState<Product[]>([]);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]) => ({
          id,
          ...(product as Omit<Product, 'id'>),
        }));

        // Sort and filter newest products (top 4 most recent by yearReleased)
        const newest = productsArray
          .sort((a, b) => b.yearReleased - a.yearReleased)
          .slice(0, 4);
        setNewestProducts(newest);

        // Filter and sort most discounted products (top 4 with highest discount percentage)
        const discountedProducts = productsArray
          .filter((product) => product.salePrice && product.salePrice < product.price)
          .map((product) => ({
            ...product,
            discountPercentage: Math.round(
              ((product.price - product.salePrice) / product.price) * 100
            ),
          }))
          .sort((a, b) => b.discountPercentage - a.discountPercentage)
          .slice(0, 4);
        setMostDiscountedProducts(discountedProducts);

        // Sort and filter cheapest products
        const cheapest = productsArray
          .sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price))
          .slice(0, 4);
        setCheapestProducts(cheapest);

        setProducts(productsArray);
      }
    });

    return () => unsubscribe();
  }, []);

  const slides = [
    {
      image: 'https://i.pinimg.com/originals/a6/49/05/a64905c8084871f7e772e499892a9e3a.gif',
      title: 'Chào mừng đến JNX Store',
      description: 'Trải nghiệm mua sắm tennis chuyên nghiệp',
    },
    {
      image: 'https://i.pinimg.com/originals/55/b2/2f/55b22f63bf49e1aca0e3a4dea4da5ad4.gif',
      title: 'Siêu Khuyến Mãi Mùa Hè',
      description: 'Giảm giá lên đến 50% các sản phẩm được chọn',
    },
    {
      image: 'https://i.pinimg.com/originals/71/5a/3d/715a3d6dcdd4225528d79f104e2e0785.gif',
      title: 'Miễn Phí Vận Chuyển',
      description: 'Cho đơn hàng trên 2,000,000 VND',
    },
  ];

  const ProductSection = ({
    title,
    icon,
    iconColor,
    products,
    linkHref,
  }: {
    title: string;
    icon: any;
    iconColor: string;
    products: Product[];
    linkHref: string;
  }) => (
    <section className="my-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-3xl font-bold flex items-center ${iconColor}`}>
          <FontAwesomeIcon icon={icon} className="mr-4" />
          {title}
        </h2>
        <Link href={linkHref} className="text-blue-600 hover:underline flex items-center">
          Xem tất cả
          <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Carousel slides={slides} />

      {/* Newest Products Section */}
      <ProductSection
        title="Sản phẩm mới nhất"
        icon={faCalendarPlus}
        iconColor="text-blue-500"
        products={newestProducts}
        linkHref="/pages/products?sort=newest"
      />

      {/* Most Discounted Products Section */}
      <section className="my-16 bg-gray-50 py-12 px-8 rounded-lg">
        <ProductSection
          title="Sản phẩm khuyến mãi nhiều nhất"
          icon={faTag}
          iconColor="text-red-500"
          products={mostDiscountedProducts}
          linkHref="/pages/products?sort=discount"
        />
      </section>

      {/* Cheapest Products Section */}
      <ProductSection
        title="Sản phẩm giá tốt nhất"
        icon={faDollarSign}
        iconColor="text-green-500"
        products={cheapestProducts}
        linkHref="/pages/products?sort=price-asc"
      />

      {/* Why Choose Us Section */}
      <section className="my-16 bg-gray-100 py-12 px-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-center">Tại sao chọn chúng tôi?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faShippingFast} className="text-4xl text-blue-500 mr-4" />
            <div>
              <h3 className="text-xl font-semibold">Giao hàng nhanh chóng</h3>
              <p>Miễn phí giao hàng cho đơn hàng trên 2 triệu đồng</p>
            </div>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-4xl text-green-500 mr-4" />
            <div>
              <h3 className="text-xl font-semibold">Đảm bảo hoàn tiền</h3>
              <p>30 ngày đổi trả miễn phí</p>
            </div>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faHeadset} className="text-4xl text-red-500 mr-4" />
            <div>
              <h3 className="text-xl font-semibold">Hỗ trợ 24/7</h3>
              <p>Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Registration Section */}
      <section className="my-16 bg-blue-50 py-12 px-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-center">Đăng Ký Nhận Tin</h2>
        <p className="text-center mb-6 max-w-2xl mx-auto">
          Đăng ký để nhận thông tin mới nhất về sản phẩm, khuyến mãi độc quyền và các sự kiện
          tennis
        </p>
        <form className="max-w-xl mx-auto flex flex-col md:flex-row gap-4">
          <input
            type="email"
            placeholder="Nhập địa chỉ email của bạn"
            className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Đăng Ký Ngay
          </button>
        </form>
      </section>
    </div>
  );
}