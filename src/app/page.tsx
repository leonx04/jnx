'use client'

import { faArrowRight, faHeadset, faMoneyBillWave, faShippingFast } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import Carousel from './components/Carousel';
import ProductCard from './components/ProductCard';

const featuredProducts = [
  { id: 1, name: 'Smartphone XYZ', price: 9990000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 2, name: 'Laptop ABC', price: 19990000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 3, name: 'Smartwatch 123', price: 2990000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 4, name: 'Wireless Earbuds', price: 1990000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
];

const saleProducts = [
  { id: 5, name: 'Bluetooth Speaker', price: 890000, originalPrice: 1290000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 6, name: 'Gaming Mouse', price: 590000, originalPrice: 790000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 7, name: 'External SSD 1TB', price: 2490000, originalPrice: 2990000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 8, name: 'Mechanical Keyboard', price: 1490000, originalPrice: 1790000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 9, name: 'Wireless Charger', price: 390000, originalPrice: 590000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 10, name: 'Fitness Tracker', price: 990000, originalPrice: 1290000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 11, name: 'Portable Power Bank', price: 690000, originalPrice: 890000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
  { id: 12, name: 'Noise-Canceling Headphones', price: 3990000, originalPrice: 4490000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif' },
];

export default function Home() {
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
          {saleProducts.slice(0, 8).map((product) => (
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

