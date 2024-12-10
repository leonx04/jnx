import { useAuthContext } from '@/app/context/AuthContext';
import { database } from '@/firebaseConfig';
import { faExclamationTriangle, faShoppingCart, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { get, push, ref, set } from "firebase/database";
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  brand: string;
  rating: number;
  reviewCount: number;
  availableStock: number;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { user } = useAuthContext();
  const [isAdding, setIsAdding] = useState(false);

  const calculateDiscountPercentage = () => {
    if (product.salePrice < product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);
    }
    return 0;
  };

  const addToCart = async () => {
    if (user) {
      setIsAdding(true);
      const cartRef = ref(database, `carts/${user.email.replace('.', ',')}`);
      const snapshot = await get(cartRef);
      const existingCart = snapshot.val() || {};
      
      const existingItem = Object.entries(existingCart).find(([_, item]: [string, any]) => item.productId === product.id);
      
      if (existingItem) {
        const [key, item] = existingItem;
        if (item.quantity >= product.availableStock) {
          toast.error(`Đã đạt số lượng tối đa có sẵn (${product.availableStock})`);
          setIsAdding(false);
          return;
        }
        set(ref(database, `carts/${user.email.replace('.', ',')}/${key}`), {
          ...item,
          quantity: item.quantity + 1
        });
      } else {
        push(cartRef, {
          name: product.name,
          price: product.salePrice || product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
          productId: product.id
        });
      }
      
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
      setTimeout(() => setIsAdding(false), 500);
    } else {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
    }
  };

  const discountPercentage = calculateDiscountPercentage();

  return (
    <div className="relative bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full transition-transform duration-300 hover:scale-105">
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs z-10">
          -{ discountPercentage }%
        </div>
      )}

      <div className="relative w-full aspect-square">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="absolute inset-0 object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="h-12 overflow-hidden line-clamp-2 mb-2 font-semibold text-base leading-tight">
            {product.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2 truncate">{product.brand}</p>
          
          <div className="flex items-center mb-2 h-6">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="relative w-4 h-4 mx-0.5">
                  <FontAwesomeIcon 
                    icon={faStar} 
                    className="absolute text-gray-300" 
                  />
                  {product.rating >= index && (
                    <div 
                      className="absolute overflow-hidden text-yellow-500"
                      style={{
                        width: `${product.rating >= index + 1 ? '100%' : `${(product.rating - index) * 100}%`}`
                      }}
                    >
                      <FontAwesomeIcon icon={faStar} />
                    </div>
                  )}
                </div>
              ))}
              <span className="text-xs text-gray-600 ml-2">
                ({product.rating.toFixed(1)}) {product.reviewCount}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-2 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-base font-bold text-blue-600">
              {(product.salePrice || product.price).toLocaleString('vi-VN')} ₫
            </span>
            {product.salePrice < product.price && (
              <span className="text-xs text-gray-500 line-through">
                {product.price.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={addToCart}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded text-xs transition-all duration-300 flex items-center ${isAdding ? 'scale-110' : ''}`}
              disabled={isAdding || product.availableStock === 0}
            >
              <FontAwesomeIcon icon={faShoppingCart} className={`mr-1 ${isAdding ? 'animate-bounce' : ''}`} />
              {isAdding ? 'Đã thêm' : product.availableStock === 0 ? 'Hết hàng' : 'Thêm'}
            </button>
            <Link
              href={`/pages/products/${product.id}`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded text-xs transition-colors duration-300"
            >
              Chi tiết
            </Link>
          </div>
        </div>
        {product.availableStock <= 5 && product.availableStock > 0 && (
          <div className="mt-2 text-xs text-orange-500 flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
            <span>Chỉ còn {product.availableStock} sản phẩm</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

