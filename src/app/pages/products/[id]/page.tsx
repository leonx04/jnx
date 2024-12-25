'use client'

import {
  faBalanceScale,
  faBolt,
  faBoxOpen,
  faCalendarAlt,
  faCheck,
  faCogs,
  faCompressArrowsAlt,
  faExclamationTriangle,
  faGlobe,
  faGripLines,
  faHandPaper,
  faPalette,
  faRulerHorizontal,
  faRulerVertical,
  faShieldAlt,
  faStar,
  faTrophy,
  faUser,
  faWeight
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { equalTo, get, onValue, orderByChild, push, query, ref, set } from "firebase/database"
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { useAuthContext } from '@/app/context/AuthContext'
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { database } from '@/firebaseConfig'
import RelatedProducts from '@/app/components/RelatedProducts'

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  description?: string;
  detailedDescription?: string;
  availableStock?: number;
  brand?: string;
  category?: string;
  features?: string[];
  weight?: string;
  headSize?: string;
  length?: string;
  composition?: string;
  gripSize?: string;
  color?: string;
  recommendedFor?: string;
  stringPattern?: string;
  swingWeight?: number;
  powerLevel?: string;
  comfortLevel?: string;
  yearReleased?: number;
  warranty?: string;
  origin?: string;
  bestSellerRank?: number;
  balance?: string;
  stiffness?: number;
  swingSpeed?: string;
  playerType?: string;
  stringTension?: string;
  material?: string;
  technology?: string;
  frameProfile?: string;
}

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  productId: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  rating: number;
  createdAt: number;
}

interface SpecItemProps {
  icon: typeof faStar;
  label: string;
  value?: string | number;
}

function SpecItem({ icon, label, value }: SpecItemProps) {
  return (
    <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md">
      <FontAwesomeIcon icon={icon} className="text-primary" />
      <div>
        <span className="text-sm text-gray-600">{label}:</span>
        <span className="ml-1 font-medium">
          {value !== undefined ? value.toString() : 'Không có dữ liệu'}
        </span>
      </div>
    </div>
  )
}

export default function ProductDetails() {
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState<number>(0)
  const { user } = useAuthContext()
  const params = useParams()
  const productId = params.id as string

  const calculateDiscountPercentage = useCallback(() => {
    if (product && product.salePrice && product.salePrice < product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);
    }
    return 0;
  }, [product]);

  const fetchReviews = useCallback(async () => {
    if (!product) return;
    const reviewsRef = ref(database, `reviews/${product.id}`);
    const snapshot = await get(reviewsRef);
    if (snapshot.exists()) {
      const reviewsData = snapshot.val();
      const reviewsArray = await Promise.all(
        Object.entries(reviewsData).map(async ([id, data]) => {
          const userRef = ref(database, `users/${(data as Review).userId}`);
          const userSnapshot = await get(userRef);
          const userData = userSnapshot.val();
          return {
            ...(data as Review),
            id,
            userName: userData ? userData.name : 'Người dùng ẩn danh',
          };
        })
      );
      setReviews(reviewsArray);

      // Calculate average rating
      const ratings = reviewsArray.map(review => review.rating);
      const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
      const avgRating = totalRating / ratings.length;
      setAverageRating(avgRating);
      setReviewCount(ratings.length);
    } else {
      setReviews([]);
      setAverageRating(null);
      setReviewCount(0);
    }
  }, [product]);

  useEffect(() => {
    const productsRef = ref(database, 'products')
    const productQuery = query(productsRef, orderByChild('id'), equalTo(productId))

    const unsubscribe = onValue(productQuery, (snapshot) => {
      if (snapshot.exists()) {
        const productData = Object.values(snapshot.val())[0] as Product
        setProduct(productData)
      } else {
        console.log("Không tìm thấy sản phẩm với ID đã cho")
      }
    })

    return () => unsubscribe()
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleAddToCart = async () => {
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

    if (!product) {
      toast.error('Không tìm thấy thông tin sản phẩm');
      return;
    }

    if (product.availableStock !== undefined && quantity > product.availableStock) {
      toast.error(`Số lượng vượt quá hàng có sẵn (${product.availableStock})`);
      return;
    }

    setIsAdding(true);
    const cartRef = ref(database, `carts/${user.id}`);
    const snapshot = await get(cartRef);
    const existingCart = snapshot.val() as Record<string, CartItem> | null;

    const existingItem = existingCart ? Object.entries(existingCart).find(([_, item]) => item.productId === product.id) : null;

    if (existingItem) {
      const [key, item] = existingItem;
      const newQuantity = item.quantity + quantity;
      if (product.availableStock !== undefined && newQuantity > product.availableStock) {
        toast.error(`Tổng số lượng vượt quá hàng có sẵn (${product.availableStock})`);
        setIsAdding(false);
        return;
      }
      await set(ref(database, `carts/${user.id}/${key}`), {
        ...item,
        quantity: newQuantity
      });
    } else {
      await push(cartRef, {
        name: product.name,
        price: product.salePrice || product.price,
        quantity: quantity,
        imageUrl: product.imageUrl,
        productId: product.id
      });
    }

    toast.success('Đã thêm sản phẩm vào giỏ hàng');
    setTimeout(() => setIsAdding(false), 500);
  };

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Đang tải...</div>
  }

  const discountPercentage = calculateDiscountPercentage();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square">
            {discountPercentage > 0 && (
              <div className="absolute top-0 left-0 bg-red-500 text-white px-3 py-1 rounded-br-lg text-sm z-10">
                Giảm {discountPercentage}%
              </div>
            )}
            <Image
              src={product.imageUrl}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <div className="flex items-center">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="relative w-5 h-5 mx-0.5">
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
            <span className="ml-2 text-gray-600">
              {averageRating !== null ? `(${averageRating.toFixed(1)}) ${reviewCount} đánh giá` : 'Chưa có đánh giá'}
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-primary">
              {(product.salePrice || product.price).toLocaleString('vi-VN')} ₫
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-lg text-gray-500 line-through">
                {product.price.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>

          {product.availableStock !== undefined && (
            <div className="flex items-center text-green-600">
              <FontAwesomeIcon icon={faBoxOpen} className="mr-2" />
              <span>Còn hàng: {product.availableStock} sản phẩm</span>
            </div>
          )}

          {product.description && <p className="text-gray-700">{product.description}</p>}

          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-2 border-x">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.availableStock ?? Infinity, quantity + 1))}
                className="px-3 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdding || (product.availableStock !== undefined && quantity > product.availableStock)}
              className={`flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-md transition-colors ${isAdding || (product.availableStock !== undefined && quantity > product.availableStock) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
          </div>
          {product.availableStock !== undefined && quantity > product.availableStock && (
            <div className="text-red-500">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
              Số lượng vượt quá hàng có sẵn
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-12">
        <TabsList className="w-full justify-start border-b mb-4">
          <TabsTrigger value="description">Mô tả</TabsTrigger>
          <TabsTrigger value="specifications">Thông số</TabsTrigger>
          <TabsTrigger value="features">Tính năng</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
        </TabsList>
        <TabsContent value="description">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed">{product.detailedDescription || 'Không có mô tả chi tiết.'}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="specifications">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SpecItem icon={faWeight} label="Trọng lượng" value={product.weight} />
                <SpecItem icon={faRulerHorizontal} label="Kích thước đầu vợt" value={product.headSize} />
                <SpecItem icon={faRulerVertical} label="Chiều dài" value={product.length} />
                <SpecItem icon={faGripLines} label="Kích thước cán" value={product.gripSize} />
                <SpecItem icon={faPalette} label="Màu sắc" value={product.color} />
                <SpecItem icon={faCompressArrowsAlt} label="Mẫu dây" value={product.stringPattern} />
                <SpecItem icon={faBalanceScale} label="Trọng lượng swing" value={product.swingWeight} />
                <SpecItem icon={faBolt} label="Mức độ lực" value={product.powerLevel} />
                <SpecItem icon={faHandPaper} label="Mức độ thoải mái" value={product.comfortLevel} />
                <SpecItem icon={faCalendarAlt} label="Năm ra mắt" value={product.yearReleased} />
                <SpecItem icon={faShieldAlt} label="Bảo hành" value={product.warranty} />
                <SpecItem icon={faGlobe} label="Xuất xứ" value={product.origin} />
                <SpecItem icon={faTrophy} label="Xếp hạng bán chạy" value={product.bestSellerRank} />
                <SpecItem icon={faUser} label="Loại người chơi" value={product.playerType} />
                <SpecItem icon={faCogs} label="Độ cứng" value={product.stiffness} />
                <SpecItem icon={faCompressArrowsAlt} label="Cấu trúc khung" value={product.frameProfile} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="features">
          <Card>
            <CardContent className="pt-6">
              {product.features && product.features.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none pl-0">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center bg-gray-50 p-3 rounded-md">
                      <FontAwesomeIcon icon={faCheck} className="mr-3 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 italic">Không có thông tin về tính năng sản phẩm.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-2xl font-semibold mb-6">Đánh giá từ khách hàng</h3>
              {reviews.length > 0 ? (
                <ul className="space-y-6">
                  {reviews.map((review) => (
                    <li key={review.id} className="border-b pb-6">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FontAwesomeIcon
                              key={star}
                              icon={faStar}
                              className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {new Date(review.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                      <p className="text-sm text-gray-600">
                        {review.userName}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 italic">Chưa có đánh giá nào cho sản phẩm này.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {product && (
        <RelatedProducts
          currentProductId={product.id}
          currentProductBrand={product.brand || ''}
          currentProductCategory={product.category || ''}
        />
      )}
    </div>
  )
}

