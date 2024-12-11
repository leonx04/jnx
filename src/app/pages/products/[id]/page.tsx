'use client'

import { useAuthContext } from '@/app/context/AuthContext'
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { database } from '@/firebaseConfig'
import {
  faBalanceScale, faBolt,
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
  faRulerHorizontal, faRulerVertical,
  faShieldAlt,
  faStar,
  faTrophy, faUser,
  faWeight
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { equalTo, get, onValue, orderByChild, push, query, ref, set } from "firebase/database"
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  description: string;
  detailedDescription: string;
  rating: number;
  reviewCount: number;
  availableStock: number;
  brand: string;
  category: string;
  features: string[];
  weight: string;
  headSize: string;
  length: string;
  composition: string;
  gripSize: string;
  color: string;
  recommendedFor: string;
  stringPattern: string;
  swingWeight: number;
  powerLevel: string;
  comfortLevel: string;
  yearReleased: number;
  warranty: string;
  origin: string;
  bestSellerRank: number;
  balance: string;
  stiffness: number;
  swingSpeed: string;
  playerType: string;
  stringTension: string;
  material: string;
  technology: string;
  frameProfile: string;
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
  comment: string;
  rating: number;
  createdAt: number;
}

export default function ProductDetails() {
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const { user } = useAuthContext()
  const params = useParams()
  const [reviews, setReviews] = useState<Review[]>([])

  const calculateDiscountPercentage = () => {
    if (product && product.salePrice && product.salePrice < product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);
    }
    return 0;
  };

  const fetchReviews = useCallback(async () => {
    if (!product) return
    const reviewsRef = ref(database, `reviews/${product.id}`)
    const snapshot = await get(reviewsRef)
    if (snapshot.exists()) {
      const reviewsData = snapshot.val()
      // eslint-disable-next-line
      const reviewsArray = Object.entries(reviewsData).map(([id, data]: [string, any]) => ({
        id,
        ...data
      }))
      setReviews(reviewsArray)
    }
  }, [product])

  useEffect(() => {
    const productsRef = ref(database, 'products')
    const productQuery = query(productsRef, orderByChild('id'), equalTo(params.id as string))
    // eslint-disable-next-line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onValue(productQuery, (snapshot) => {
      if (snapshot.exists()) {
        const productData = Object.values(snapshot.val())[0] as Product
        setProduct(productData)
      } else {
        console.log("Không tìm thấy sản phẩm với ID đã cho")
      }
    })
  }, [params.id])

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

    if (quantity > product.availableStock) {
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
      if (newQuantity > product.availableStock) {
        toast.error(`Tổng số lượng vượt quá hàng có sẵn (${product.availableStock})`);
        setIsAdding(false);
        return;
      }
      set(ref(database, `carts/${user.id}/${key}`), {
        ...item,
        quantity: newQuantity
      });
    } else {
      push(cartRef, {
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
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 relative">
        {discountPercentage > 0 && (
          <div className="absolute top-0 left-0 bg-red-500 text-white px-3 py-1 rounded-br-lg text-sm z-10">
            Giảm {discountPercentage}%
          </div>
        )}

        <div className="relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={500}
            height={500}
            className="w-full h-auto object-cover rounded-lg shadow-lg"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <div className="flex items-center mb-4">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="relative w-5 h-5 mx-0.5">
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
            <span className="ml-2 text-gray-600">
              ({product.rating.toFixed(1)}) {product.reviewCount} đánh giá
            </span>
          </div>

          <div className="mb-4">
            <span className="text-2xl font-bold text-dark-600 mr-3">
              {(product.salePrice || product.price).toLocaleString('vi-VN')} ₫
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-lg text-gray-500 line-through">
                {product.price.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>

          <div className="mb-4 flex items-center">
            <FontAwesomeIcon icon={faBoxOpen} className="mr-2 text-green-500" />
            <span>Còn hàng: {product.availableStock} sản phẩm</span>
          </div>

          <p className="mb-4">{product.description}</p>
          <div className="flex items-center mb-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="bg-gray-200 px-3 py-1 rounded-l"
            >
              -
            </button>
            <span className="bg-gray-100 px-4 py-1">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.availableStock, quantity + 1))}
              className="bg-gray-200 px-3 py-1 rounded-r"
            >
              +
            </button>
          </div>
          {quantity > product.availableStock && (
            <div className="text-red-500 mb-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
              Số lượng vượt quá hàng có sẵn
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || quantity > product.availableStock}
            className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ${isAdding || quantity > product.availableStock ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-8">
        <TabsList>
          <TabsTrigger value="description">Mô tả chi tiết</TabsTrigger>
          <TabsTrigger value="specifications">Thông số kỹ thuật</TabsTrigger>
          <TabsTrigger value="features">Tính năng</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
        </TabsList>
        <TabsContent value="description">
          <Card>
            <CardContent className="pt-6">
              <p>{product.detailedDescription}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="specifications">
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faWeight} className="mr-2 text-dark-500" />
                    <span>Trọng lượng: {product.weight}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faRulerHorizontal} className="mr-2 text-dark-500" />
                    <span>Kích thước đầu vợt: {product.headSize}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faRulerVertical} className="mr-2 text-dark-500" />
                    <span>Chiều dài: {product.length}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faGripLines} className="mr-2 text-dark-500" />
                    <span>Kích thước cán: {product.gripSize}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faPalette} className="mr-2 text-dark-500" />
                    <span>Màu sắc: {product.color}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCompressArrowsAlt} className="mr-2 text-dark-500" />
                    <span>Mẫu dây: {product.stringPattern}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faBalanceScale} className="mr-2 text-dark-500" />
                    <span>Trọng lượng swing: {product.swingWeight}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faBolt} className="mr-2 text-dark-500" />
                    <span>Mức độ lực: {product.powerLevel}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faHandPaper} className="mr-2 text-dark-500" />
                    <span>Mức độ thoải mái: {product.comfortLevel}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-dark-500" />
                    <span>Năm ra mắt: {product.yearReleased}</span>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-dark-500" />
                    <span>Bảo hành: {product.warranty}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faGlobe} className="mr-2 text-dark-500" />
                    <span>Xuất xứ: {product.origin}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faTrophy} className="mr-2 text-dark-500" />
                    <span>Xếp hạng bán chạy: {product.bestSellerRank}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-dark-500" />
                    <span>Loại người chơi: {product.playerType}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCogs} className="mr-2 text-dark-500" />
                    <span>Độ cứng: {product.stiffness}</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCompressArrowsAlt} className="mr-2 text-dark-500" />
                    <span>Cấu trúc khung: {product.frameProfile}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="features">
          <Card>
            <CardContent className="pt-6">
              <ul className="grid md:grid-cols-2 gap-2 list-none pl-0">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <FontAwesomeIcon icon={faCheck} className="mr-2 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Đánh giá từ khách hàng</h3>
              {reviews.length > 0 ? (
                <ul className="space-y-4">
                  {reviews.map((review) => (
                    <li key={review.id} className="border-b pb-4">
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
                      <p className="text-gray-700">{review.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Chưa có đánh giá nào cho sản phẩm này.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
