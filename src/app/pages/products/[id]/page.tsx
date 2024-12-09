'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart, faStar, faShieldAlt, faUndo } from '@fortawesome/free-solid-svg-icons'
import { ref, onValue } from "firebase/database";
import { database } from '@/firebaseConfig'

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  description: string;
  detailedDescription: string;
  rating: number;
  reviewCount: number;
  availableStock: number;
  brand: string;
  category: string;
  features: string[];
}

export default function ProductDetail() {
  const params = useParams()
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  
  useEffect(() => {
    const productRef = ref(database, `products/${params.id}`);
    onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProduct({
          id: params.id as string,
          ...data
        });
      }
    });
  }, [params.id]);

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  const handleAddToCart = () => {
    // Implement cart functionality here
    console.log(`Added ${quantity} of ${product.name} to cart`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative h-[400px] md:h-[600px] rounded-lg overflow-hidden">
          <Image
            src={product.imageUrl || '/placeholder.svg'}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <FontAwesomeIcon
                key={index}
                icon={faStar}
                className={`h-5 w-5 ${index < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
            <span className="text-gray-600">({product.reviewCount} đánh giá)</span>
          </div>

          <p className="text-gray-600">{product.description}</p>
          
          <div className="text-3xl font-bold text-blue-600">
            {product.salePrice.toLocaleString('vi-VN')} ₫
            {product.salePrice < product.price && (
              <span className="text-lg text-gray-500 line-through ml-2">
                {product.price.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="text-gray-700">Số lượng:</label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border rounded-md px-2 py-1"
              >
                {Array.from({ length: Math.min(5, product.availableStock) }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <span className="text-gray-600">
                {product.availableStock} sản phẩm có sẵn
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2"
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              <span>Thêm vào giỏ hàng</span>
            </button>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <FontAwesomeIcon icon={faShieldAlt} />
              <span>Bảo hành 12 tháng chính hãng</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <FontAwesomeIcon icon={faUndo} />
              <span>Đổi trả miễn phí trong 30 ngày</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin chi tiết</h2>
            <p className="text-gray-600">{product.detailedDescription}</p>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Đặc điểm nổi bật</h2>
            <ul className="list-disc list-inside space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="text-gray-600">{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
