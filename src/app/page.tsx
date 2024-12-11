'use client'

import { useEffect, useState } from 'react';
import { ref, onValue } from "firebase/database";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faHeadset, faMoneyBillWave, faShippingFast } from '@fortawesome/free-solid-svg-icons';
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
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    // eslint-disable-next-line
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]) => ({
          id,
          ...(product as Omit<Product, 'id'>)
        }));
        setProducts(productsArray);
      }
    });
  }, []);

  const featuredProducts = products.slice(0, 4);
  const saleProducts = products.slice(4, 12);

  const slides = [
    { 
      image: 'https://i.pinimg.com/originals/a6/49/05/a64905c8084871f7e772e499892a9e3a.gif', 
      title: 'Welcome to JNX Store', 
      description: 'Experience the future of shopping' 
    },
    { 
      image: 'https://i.pinimg.com/originals/55/b2/2f/55b22f63bf49e1aca0e3a4dea4da5ad4.gif', 
      title: 'Summer Sale', 
      description: 'Up to 50% off on selected items' 
    },
    { 
      image: 'https://i.pinimg.com/originals/71/5a/3d/715a3d6dcdd4225528d79f104e2e0785.gif', 
      title: 'Free Shipping', 
      description: 'On orders over 2,000,000 VND' 
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Carousel slides={slides} />

      <section className="my-16">
        <h2 className="text-3xl font-bold mb-8">Sản phẩm nổi bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="my-16 bg-gray-100 py-12 px-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-8">Tại sao chọn chúng tôi?</h2>
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
              <p>Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn</p>
            </div>
          </div>
        </div>
      </section>

      <section className="my-16">
        <h2 className="text-3xl font-bold mb-8">Sản phẩm giảm giá</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {saleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/pages/products" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center">
            Xem thêm sản phẩm
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Link>
        </div>
      </section>

      <section className="my-16 bg-gray-100 py-12 px-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-8">Đăng ký nhận tin</h2>
        <p className="mb-4">Đăng ký để nhận thông tin về sản phẩm mới và ưu đãi đặc biệt.</p>
        <form className="flex flex-col md:flex-row gap-4">
          <input
            type="email"
            placeholder="Nhập địa chỉ email của bạn"
            className="flex-grow p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Đăng ký
          </button>
        </form>
      </section>
    </div>
  );
}

