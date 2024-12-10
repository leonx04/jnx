import { StarIcon, ShoppingCartIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthContext } from '@/app/context/AuthContext';
import { database } from '@/firebaseConfig';
import { ref, push, set, get } from "firebase/database";
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  brand: string;
  rating: number;
  reviewCount: number;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { user } = useAuthContext();
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = async () => {
    if (user) {
      setIsAdding(true);
      const cartRef = ref(database, `carts/${user.email.replace('.', ',')}`);
      const snapshot = await get(cartRef);
      const existingCart = snapshot.val() || {};
      
      const existingItem = Object.entries(existingCart).find(([_, item]: [string, any]) => item.name === product.name);
      
      if (existingItem) {
        const [key, item] = existingItem;
        set(ref(database, `carts/${user.email.replace('.', ',')}/${key}`), {
          ...item,
          quantity: item.quantity + 1
        });
      } else {
        push(cartRef, {
          name: product.name,
          price: product.salePrice || product.price,
          quantity: 1,
          imageUrl: product.imageUrl
        });
      }
      
      setTimeout(() => setIsAdding(false), 500);
    } else {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
    }
  };

  const calculateDiscountPercentage = () => {
    if (product.salePrice && product.salePrice < product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);
    }
    return 0;
  };

  return (
    <div className="relative bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full transition-transform duration-300 hover:scale-105">
      {/* Hiển thị phần trăm giảm giá */}
      {calculateDiscountPercentage() > 0 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs z-10">
          -{ calculateDiscountPercentage() }%
        </div>
      )}

      <div className="relative w-full aspect-square">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow flex flex-col">
          <h3 className="h-12 overflow-hidden line-clamp-2 mb-2 font-semibold text-base leading-tight">
            {product.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2 truncate">{product.brand}</p>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((starNumber) => (
                <StarIcon 
                  key={starNumber}
                  fill={starNumber <= Math.round(product.rating) ? '#FFC107' : 'none'}
                  stroke={starNumber <= Math.round(product.rating) ? '#FFC107' : '#gray'}
                  className="w-4 h-4 mr-0.5"
                />
              ))}
              <span className="text-xs text-gray-600 ml-2">
                ({product.rating.toFixed(1)}) {product.reviewCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-base font-bold text-blue-600">
                {(product.salePrice || product.price).toLocaleString('vi-VN')} ₫
              </span>
              {product.salePrice && product.salePrice < product.price && (
                <span className="text-xs text-gray-500 line-through">
                  {product.price.toLocaleString('vi-VN')} ₫
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={addToCart}
                className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded text-xs transition-all duration-300 flex items-center ${isAdding ? 'scale-110' : ''}`}
                disabled={isAdding}
              >
                <ShoppingCartIcon className={`mr-1 w-4 h-4 ${isAdding ? 'animate-bounce' : ''}`} />
                {isAdding ? 'Đã thêm' : 'Thêm'}
              </button>
              <Link
                href={`/pages/products/${product.id}`}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded text-xs transition-colors duration-300"
              >
                Chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;