import { useAuthContext } from '@/app/context/AuthContext';
import { database } from '@/firebaseConfig';
import { faExclamationTriangle, faShoppingCart, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { get, push, ref, set } from "firebase/database";
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;  // Đặt optional cho salePrice
  imageUrl: string;
  brand: string;
  availableStock: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface Review {
  rating: number;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { user } = useAuthContext();
  const [isAdding, setIsAdding] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);

  // Kiểm tra xem có giá khuyến mãi hợp lệ không
  const hasValidSalePrice = product.salePrice && product.salePrice < product.price;

  const calculateDiscountPercentage = () => {
    if (hasValidSalePrice) {
      return Math.round(((product.price - product.salePrice!) / product.price) * 100);
    }
    return 0;
  };

  const addToCart = async () => {
    if (!user) {
      toast.error(
        <div>
          Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.
          <br />
          <Link href="/pages/login" className="text-blue-500 hover:underline">
            Đăng nhập ngay
          </Link>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    if (product.availableStock === 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    setIsAdding(true);
    const cartRef = ref(database, `carts/${user.id}`);
    const snapshot = await get(cartRef);
    const existingCart = snapshot.val() as Record<string, CartItem> || {};

    const existingItem = Object.entries(existingCart).find(([_, item]) => item.productId === product.id);

    if (existingItem) {
      const [key, item] = existingItem;
      if (item.quantity >= product.availableStock) {
        toast.error(`Đã đạt số lượng tối đa có sẵn (${product.availableStock})`);
        setIsAdding(false);
        return;
      }
      set(ref(database, `carts/${user.id}/${key}`), {
        ...item,
        quantity: item.quantity + 1
      });
    } else {
      push(cartRef, {
        name: product.name,
        price: hasValidSalePrice ? product.salePrice! : product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        productId: product.id
      });
    }

    toast.success('Đã thêm sản phẩm vào giỏ hàng');
    setTimeout(() => setIsAdding(false), 500);
  };

  const calculateAverageRating = useCallback(async () => {
    const reviewsRef = ref(database, `reviews/${product.id}`);
    const snapshot = await get(reviewsRef);
    const reviews = snapshot.val() as Record<string, Review> | null;

    if (reviews) {
      const ratings = Object.values(reviews).map((review) => review.rating);
      const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
      const avgRating = totalRating / ratings.length;
      setAverageRating(avgRating);
      setReviewCount(ratings.length);
    } else {
      setAverageRating(null);
      setReviewCount(0);
    }
  }, [product.id]);

  useEffect(() => {
    calculateAverageRating();
  }, [calculateAverageRating]);

  const discountPercentage = calculateDiscountPercentage();

  return (
    <div className="w-full transform transition-transform duration-300 hover:scale-105">
      <div className="relative bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full group">
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
            -{discountPercentage}%
          </div>
        )}

        {/* Product Image */}
        <div className="relative aspect-square w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="absolute inset-0 object-contain p-4"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={true}
          />
        </div>

        {/* Product Details */}
        <div className="p-2.5 sm:p-3 lg:p-4 flex flex-col flex-grow">
          {/* Brand */}
          <p className="text-xs text-gray-600 mb-1 truncate">
            {product.brand}
          </p>

          {/* Product Name */}
          <h3 className="min-h-[2.5rem] sm:min-h-[3rem] text-sm font-medium leading-tight mb-1.5 line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center mb-1.5">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="relative w-3 h-3 mx-0.5">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="absolute text-gray-300"
                  />
                  {averageRating !== null && averageRating > index && (
                    <div
                      className="absolute overflow-hidden text-yellow-500"
                      style={{
                        width: `${averageRating >= index + 1 ? '100%' : `${(averageRating - index) * 100}%`}`
                      }}
                    >
                      <FontAwesomeIcon icon={faStar} />
                    </div>
                  )}
                </div>
              ))}
              <span className="text-[10px] text-gray-600 ml-1.5">
                {averageRating !== null ? `(${averageRating.toFixed(1)}) ${reviewCount}` : 'Chưa có đánh giá'}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="mt-auto mb-1.5">
            <div className="flex items-center justify-between">
              {hasValidSalePrice ? (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    {product.price.toLocaleString('vi-VN')}₫
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {product.salePrice ? product.salePrice.toLocaleString('vi-VN') : ''}₫
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-black">
                  {product.price.toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-1.5 mt-1.5">
            <button
              onClick={addToCart}
              className={`flex-1 bg-black hover:bg-gray-800 text-white font-medium py-1.5 px-2 rounded text-xs transition-all duration-300 flex items-center justify-center ${isAdding ? 'scale-105' : ''} ${product.availableStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isAdding || product.availableStock === 0}
            >
              <FontAwesomeIcon icon={faShoppingCart} className={`mr-1 ${isAdding ? 'animate-bounce' : ''}`} />
              <span>
                {isAdding ? 'Đã thêm' : product.availableStock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
              </span>
            </button>
            <Link
              href={`/pages/products/${product.id}`}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-2 rounded text-xs transition-colors duration-300 flex items-center justify-center"
            >
              Chi tiết
            </Link>
          </div>

          {/* Stock Warning */}
          {product.availableStock <= 5 && product.availableStock > 0 && (
            <div className="mt-1.5 text-[10px] text-orange-500 flex items-center justify-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
              <span>Chỉ còn {product.availableStock} sản phẩm</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;