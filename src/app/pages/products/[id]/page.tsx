'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart, faStar, faShieldAlt, faUndo } from '@fortawesome/free-solid-svg-icons'

// Temporary product data - in a real app, this would come from an API or database
const products = [
  { id: 1, name: 'Smartphone XYZ', price: 9990000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif', description: 'Điện thoại thông minh với camera chất lượng cao và pin trâu.', rating: 4.5, stock: 10 },
  { id: 2, name: 'Laptop ABC', price: 19990000, image: 'https://i.pinimg.com/originals/e4/c3/9a/e4c39a73c1d9f9d32ca69f9ea0783c66.gif', description: 'Laptop mạnh mẽ với card đồ họa cao cấp.', rating: 4.8, stock: 5 },
  // ... add more products as needed
]

export default function ProductDetail() {
  const params = useParams()
  const [quantity, setQuantity] = useState(1)
  
  // Find the product based on the ID from the URL
  const product = products.find(p => p.id === Number(params.id))
  
  if (!product) {
    return <div className="container mx-auto px-4 py-8">Không tìm thấy sản phẩm</div>
  }

  const handleAddToCart = () => {
    // Implement cart functionality here
    console.log(`Added ${quantity} of ${product.name} to cart`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative h-[400px] rounded-lg overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="flex items-center space-x-2">
            {[...Array(5)].map((_, index) => (
              <FontAwesomeIcon
                key={index}
                icon={faStar}
                className={`h-5 w-5 ${index < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
            <span className="text-gray-600">({product.rating})</span>
          </div>

          <p className="text-gray-600">{product.description}</p>
          
          <div className="text-3xl font-bold text-blue-600">
            {product.price.toLocaleString('vi-VN')} ₫
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
                {[...Array(Math.min(5, product.stock))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <span className="text-gray-600">
                {product.stock} sản phẩm có sẵn
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
        </div>
      </div>
    </div>
  )
}

