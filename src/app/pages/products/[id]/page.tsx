'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { database } from '@/firebaseConfig'
import {
  faBalanceScale,
  faBolt,
  faCalendarAlt,
  faCheck,
  faCogs,
  faCompressArrowsAlt,
  faGlobe,
  faGripLines,
  faHandPaper,
  faPalette,
  faRulerHorizontal,
  faRulerVertical,
  faShieldAlt,
  faShoppingCart,
  faStar,
  faTrophy,
  faTruck,
  faUndo,
  faUser,
  faWeight
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { equalTo, onValue, orderByChild, query, ref } from "firebase/database"
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

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

export default function ProductDetail() {
  const params = useParams()
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  
  useEffect(() => {
    const productsRef = ref(database, 'products');
    const productQuery = query(productsRef, orderByChild('id'), equalTo(params.id as string));
    
    onValue(productQuery, (snapshot) => {
      if (snapshot.exists()) {
        const productData = Object.values(snapshot.val())[0] as Product;
        setProduct(productData);
      } else {
        console.log("No product found with the given ID");
      }
    });
  }, [params.id]);

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  const handleAddToCart = () => {
    console.log(`Added ${quantity} of ${product.name} to cart`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden">
          <Image
            src={product.imageUrl || '/placeholder.svg'}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="flex items-center space-x-2">
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
            <span className="text-gray-600">
              ({product.rating.toFixed(1)}) {product.reviewCount} đánh giá
            </span>
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
              <FontAwesomeIcon icon={faShieldAlt} className="text-blue-500" />
              <span>Bảo hành {product.warranty}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <FontAwesomeIcon icon={faUndo} className="text-blue-500" />
              <span>Đổi trả miễn phí trong 30 ngày</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <FontAwesomeIcon icon={faTruck} className="text-blue-500" />
              <span>Giao hàng miễn phí toàn quốc</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="specs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
          <TabsTrigger value="additional">Thông tin bổ sung</TabsTrigger>
          <TabsTrigger value="description">Mô tả chi tiết</TabsTrigger>
          <TabsTrigger value="features">Đặc điểm nổi bật</TabsTrigger>
        </TabsList>
        <TabsContent value="specs">
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faWeight} className="text-blue-500" />
                  <span className="font-semibold">Trọng lượng:</span> {product.weight}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faRulerHorizontal} className="text-blue-500" />
                  <span className="font-semibold">Kích thước đầu vợt:</span> {product.headSize}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faRulerVertical} className="text-blue-500" />
                  <span className="font-semibold">Chiều dài:</span> {product.length}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faGripLines} className="text-blue-500" />
                  <span className="font-semibold">Kích thước cán:</span> {product.gripSize}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faPalette} className="text-blue-500" />
                  <span className="font-semibold">Màu sắc:</span> {product.color}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCompressArrowsAlt} className="text-blue-500" />
                  <span className="font-semibold">Mẫu dây:</span> {product.stringPattern}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faBalanceScale} className="text-blue-500" />
                  <span className="font-semibold">Trọng lượng đu đưa:</span> {product.swingWeight}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faBolt} className="text-blue-500" />
                  <span className="font-semibold">Mức độ lực:</span> {product.powerLevel}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faHandPaper} className="text-blue-500" />
                  <span className="font-semibold">Mức độ thoải mái:</span> {product.comfortLevel}
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="additional">
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500" />
                  <span className="font-semibold">Năm sản xuất:</span> {product.yearReleased}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faGlobe} className="text-blue-500" />
                  <span className="font-semibold">Xuất xứ:</span> {product.origin}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faTrophy} className="text-blue-500" />
                  <span className="font-semibold">Xếp hạng bán chạy:</span> {product.bestSellerRank}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faBalanceScale} className="text-blue-500" />
                  <span className="font-semibold">Cân bằng:</span> {product.balance}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faBolt} className="text-blue-500" />
                  <span className="font-semibold">Độ cứng:</span> {product.stiffness}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faBolt} className="text-blue-500" />
                  <span className="font-semibold">Tốc độ đu đưa:</span> {product.swingSpeed}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                  <span className="font-semibold">Loại người chơi:</span> {product.playerType}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCompressArrowsAlt} className="text-blue-500" />
                  <span className="font-semibold">Độ căng dây:</span> {product.stringTension}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCogs} className="text-blue-500" />
                  <span className="font-semibold">Chất liệu:</span> {product.material}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faCogs} className="text-blue-500" />
                  <span className="font-semibold">Công nghệ:</span> {product.technology}
                </li>
                <li className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faRulerHorizontal} className="text-blue-500" />
                  <span className="font-semibold">Cấu trúc khung:</span> {product.frameProfile}
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="description">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">{product.detailedDescription}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="features">
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                {product.features && product.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <FontAwesomeIcon icon={faCheck} className="text-green-500 mt-1" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card></TabsContent>
      </Tabs>
    </div>
  )
}

