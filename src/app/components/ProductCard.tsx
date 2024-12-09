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
      <div className="relative w-full pt-[100%]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
        <div className="flex items-center mb-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="star-rating">
              <FontAwesomeIcon icon={faStar} className="star-bg" />
              <div
                className="star-fg"
                style={{
                  width: `${Math.max(0, Math.min(100, (product.rating - index) * 100))}%`
                }}
              >
                <FontAwesomeIcon icon={faStar} />
              </div>
            </div>
          ))}
          <span className="text-sm text-gray-600 ml-1">
            ({product.rating.toFixed(1)}) {product.reviewCount}
          </span>
        </div>
        <div className="mt-auto flex justify-between items-center">
          <div>
            <span className="text-lg font-bold text-blue-600">
              {product.salePrice.toLocaleString('vi-VN')} ₫
            </span>
            {product.salePrice < product.price && (
              <span className="text-sm text-gray-500 line-through ml-2">
                {product.price.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>
          <Link
            href={`/pages/products/${product.id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors duration-300"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

