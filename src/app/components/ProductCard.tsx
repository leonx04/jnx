// Import các module và thư viện cần thiết
import { useAuthContext } from '@/app/context/AuthContext';  // Lấy thông tin người dùng từ context
import { database } from '@/firebaseConfig';  // Kết nối với cơ sở dữ liệu Firebase
import { faExclamationTriangle, faShoppingCart, faStar } from '@fortawesome/free-solid-svg-icons';  // Các icon cần dùng
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';  // Sử dụng icon FontAwesome
import { get, push, ref, set } from "firebase/database";  // Các phương thức tương tác với Firebase
import Image from 'next/image';  // Sử dụng Image từ Next.js
import Link from 'next/link';  // Sử dụng Link cho điều hướng trong Next.js
import { useCallback, useEffect, useState } from 'react';  // Các hook cần thiết
import { toast } from 'react-hot-toast';  // Thư viện thông báo

// Interface cho thông tin sản phẩm
interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  brand: string;
  availableStock: number;
}

// Interface cho thông tin giỏ hàng
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

// Interface cho thông tin đánh giá
interface Review {
  rating: number;
}

// Component hiển thị thông tin sản phẩm
const ProductCard = ({ product }: { product: Product }) => {
  const { user } = useAuthContext();  // Lấy thông tin người dùng từ context
  const [isAdding, setIsAdding] = useState(false);  // Trạng thái đang thêm vào giỏ hàng
  const [averageRating, setAverageRating] = useState<number | null>(null);  // Đánh giá trung bình của sản phẩm
  const [reviewCount, setReviewCount] = useState<number>(0);  // Số lượng đánh giá

  // Hàm tính toán tỷ lệ giảm giá
  const calculateDiscountPercentage = () => {
    if (product.salePrice < product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);  // Tính tỷ lệ giảm giá
    }
    return 0;  // Không có giảm giá
  };

  // Hàm thêm sản phẩm vào giỏ hàng
  const addToCart = async () => {
    // Kiểm tra nếu người dùng chưa đăng nhập
    if (!user) {
      toast.error(
        <div>
          Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.
          <br />
          <Link href="/pages/login" className="text-blue-500 hover:underline">
            Đăng nhập ngay
          </Link>
        </div>,
        { duration: 5000 }  // Thông báo trong 5 giây
      );
      return;
    }

    // Kiểm tra nếu sản phẩm hết hàng
    if (product.availableStock === 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    setIsAdding(true);  // Đặt trạng thái đang thêm vào giỏ
    const cartRef = ref(database, `carts/${user.id}`);  // Tham chiếu đến giỏ hàng của người dùng
    const snapshot = await get(cartRef);  // Lấy dữ liệu giỏ hàng
    const existingCart = snapshot.val() as Record<string, CartItem> || {};  // Dữ liệu giỏ hàng nếu có

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existingItem = Object.entries(existingCart).find(([_, item]) => item.productId === product.id);

    if (existingItem) {
      const [key, item] = existingItem;  // Nếu có sản phẩm trong giỏ
      // Kiểm tra số lượng sản phẩm có đủ để thêm vào giỏ không
      if (item.quantity >= product.availableStock) {
        toast.error(`Đã đạt số lượng tối đa có sẵn (${product.availableStock})`);
        setIsAdding(false);
        return;
      }
      // Cập nhật số lượng sản phẩm trong giỏ
      set(ref(database, `carts/${user.id}/${key}`), {
        ...item,
        quantity: item.quantity + 1
      });
    } else {
      // Thêm sản phẩm mới vào giỏ hàng
      push(cartRef, {
        name: product.name,
        price: product.salePrice && product.salePrice < product.price ? product.salePrice : product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        productId: product.id
      });
    }

    // Thông báo thêm sản phẩm thành công
    toast.success('Đã thêm sản phẩm vào giỏ hàng');
    setTimeout(() => setIsAdding(false), 500);  // Đặt lại trạng thái sau 500ms
  };

  // Hàm tính toán đánh giá trung bình
  const calculateAverageRating = useCallback(async () => {
    const reviewsRef = ref(database, `reviews/${product.id}`);  // Tham chiếu đến bảng đánh giá
    const snapshot = await get(reviewsRef);  // Lấy dữ liệu đánh giá
    const reviews = snapshot.val() as Record<string, Review> | null;

    if (reviews) {
      const ratings = Object.values(reviews).map((review) => review.rating);  // Lấy tất cả đánh giá
      const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);  // Tính tổng số điểm
      const avgRating = totalRating / ratings.length;  // Tính điểm trung bình
      setAverageRating(avgRating);  // Cập nhật đánh giá trung bình
      setReviewCount(ratings.length);  // Cập nhật số lượng đánh giá
    } else {
      setAverageRating(null);  // Không có đánh giá
      setReviewCount(0);  // Số lượng đánh giá bằng 0
    }
  }, [product.id]);

  useEffect(() => {
    calculateAverageRating();  // Gọi hàm tính đánh giá trung bình khi component được render
  }, [calculateAverageRating]);

  const discountPercentage = calculateDiscountPercentage();  // Tính tỷ lệ giảm giá

  return (
    <div className="relative bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full transition-transform duration-300 hover:scale-105">
      {/* Hiển thị tỷ lệ giảm giá nếu có */}
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs z-10">
          -{discountPercentage}%
        </div>
      )}

      {/* Hiển thị hình ảnh sản phẩm */}
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
          {/* Tên sản phẩm */}
          <h3 className="h-12 overflow-hidden line-clamp-2 mb-2 font-semibold text-base leading-tight">
            {product.name}
          </h3>

          {/* Thương hiệu sản phẩm */}
          <p className="text-sm text-gray-600 mb-2 truncate">{product.brand}</p>

          {/* Giá sản phẩm */}
          <div className="mt-2 flex justify-between items-center">
            <span className={`text-base font-bold ${product.salePrice && product.salePrice < product.price ? 'text-gray-500 line-through' : 'text-black'}`}>
              {product.price.toLocaleString('vi-VN')} ₫
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-base font-bold text-red-600">
                {product.salePrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>

          {/* Đánh giá sản phẩm */}
          <div className="flex items-center mb-2 h-6">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="relative w-4 h-4 mx-0.5">
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
              <span className="text-xs text-gray-600 ml-2">
                {averageRating !== null ? `(${averageRating.toFixed(1)}) ${reviewCount}` : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Các nút chức năng */}
        <div className="flex space-x-2 mt-2">
          <button
            onClick={addToCart}
            className={`bg-black hover:bg-gray-800 text-white font-bold py-2 px-3 rounded text-xs transition-all duration-300 flex items-center justify-center min-w-[70px] ${isAdding ? 'scale-110' : ''}`}
            disabled={isAdding || product.availableStock === 0}
          >
            <FontAwesomeIcon icon={faShoppingCart} className={`mr-1 ${isAdding ? 'animate-bounce' : ''}`} />
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
              {isAdding ? 'Đã thêm' : product.availableStock === 0 ? 'Hết hàng' : 'Thêm'}
            </span>
          </button>
          <Link
            href={`/pages/products/${product.id}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded text-xs transition-colors duration-300 flex items-center justify-center min-w-[70px]"
          >
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">Chi tiết</span>
          </Link>
        </div>

        {/* Cảnh báo nếu số lượng sản phẩm ít */}
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
