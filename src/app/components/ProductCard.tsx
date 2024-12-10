import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';

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
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full transition-transform duration-300 hover:scale-105">
      {/* Hình ảnh sản phẩm với tỷ lệ 1:1 cố định */}
      <div className="relative w-full aspect-square">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>
      
      {/* Nội dung card với các chiều cao cố định */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Tên sản phẩm với chiều cao cố định và cắt dòng */}
        <h3 className="h-12 overflow-hidden line-clamp-2 mb-2 font-semibold text-base leading-tight">
          {product.name}
        </h3>
        
        {/* Thương hiệu */}
        <p className="h-5 text-sm text-gray-600 mb-2 truncate">{product.brand}</p>
        
        {/* Đánh giá sao */}
        <div className="flex items-center mb-2 h-5">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="star-rating relative w-4 h-4 mx-0.5">
                <FontAwesomeIcon icon={faStar} className="absolute text-gray-300" />
                <div
                  className="absolute overflow-hidden text-yellow-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, (product.rating - index) * 100))}%`
                  }}
                >
                  <FontAwesomeIcon icon={faStar} />
                </div>
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-2">
            ({product.rating.toFixed(1)}) {product.reviewCount}
          </span>
        </div>
        
        {/* Giá sản phẩm và nút chi tiết */}
        <div className="mt-auto flex justify-between items-center h-10">
          <div className="flex flex-col">
            <span className="text-base font-bold text-blue-600">
              {product.salePrice.toLocaleString('vi-VN')} ₫
            </span>
            {product.salePrice < product.price && (
              <span className="text-xs text-gray-500 line-through">
                {product.price.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>
          <Link
            href={`/pages/products/${product.id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-xs transition-colors duration-300 min-w-[100px] text-center"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;