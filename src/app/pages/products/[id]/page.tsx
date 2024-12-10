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
        console.log("Không tìm thấy sản phẩm với ID đã cho");
      }
    });
  }, [params.id]);

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Đang tải...</div>;
  }

  const handleAddToCart = () => {
    console.log(`Đã thêm ${quantity} ${product.name} vào giỏ hàng`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg">
          <Image
            src={product.imageUrl || '/placeholder.svg'}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <FontAwesomeIcon
                key={index}
                icon={faStar}
                className={index < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"}
              />
            ))}
            <span className="text-gray-600 ml-2">
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition duration-300 ease-in-out transform hover:scale-105"
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

      <Tabs defaultValue="specs" className="w-full mt-12">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
          <TabsTrigger value="additional">Thông tin bổ sung</TabsTrigger>
          <TabsTrigger value="description">Mô tả chi tiết</TabsTrigger>
          <TabsTrigger value="features">Đặc điểm nổi bật</TabsTrigger>
        </TabsList>
        <TabsContent value="specs">
          <Card>
            <CardContent className="pt-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpecItem icon={faWeight} label="Trọng lượng" value={product.weight} />
                <SpecItem icon={faRulerHorizontal} label="Kích thước đầu vợt" value={product.headSize} />
                <SpecItem icon={faRulerVertical} label="Chiều dài" value={product.length} />
                <SpecItem icon={faGripLines} label="Kích thước cán" value={product.gripSize} />
                <SpecItem icon={faPalette} label="Màu sắc" value={product.color} />
                <SpecItem icon={faCompressArrowsAlt} label="Mẫu dây" value={product.stringPattern} />
                <SpecItem icon={faBalanceScale} label="Trọng lượng đu đưa" value={`${product.swingWeight}`} />
                <SpecItem icon={faBolt} label="Mức độ lực" value={product.powerLevel} />
                <SpecItem icon={faHandPaper} label="Mức độ thoải mái" value={product.comfortLevel} />
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="additional">
          <Card>
            <CardContent className="pt-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpecItem icon={faCalendarAlt} label="Năm sản xuất" value={`${product.yearReleased}`} />
                <SpecItem icon={faGlobe} label="Xuất xứ" value={product.origin} />
                <SpecItem icon={faTrophy} label="Xếp hạng bán chạy" value={`${product.bestSellerRank}`} />
                <SpecItem icon={faBalanceScale} label="Cân bằng" value={product.balance} />
                <SpecItem icon={faBolt} label="Độ cứng" value={`${product.stiffness}`} />
                <SpecItem icon={faBolt} label="Tốc độ đu đưa" value={product.swingSpeed} />
                <SpecItem icon={faUser} label="Loại người chơi" value={product.playerType} />
                <SpecItem icon={faCompressArrowsAlt} label="Độ căng dây" value={product.stringTension} />
                <SpecItem icon={faCogs} label="Chất liệu" value={product.material} />
                <SpecItem icon={faCogs} label="Công nghệ" value={product.technology} />
                <SpecItem icon={faRulerHorizontal} label="Cấu trúc khung" value={product.frameProfile} />
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="description">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed">{product.detailedDescription}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="features">
          <Card>
            <CardContent className="pt-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.features && product.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <FontAwesomeIcon icon={faCheck} className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SpecItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <li className="flex items-center space-x-2">
      <FontAwesomeIcon icon={icon} className="text-blue-500 w-5 h-5" />
      <span className="font-semibold">{label}:</span>
      <span className="text-gray-700">{value}</span>
    </li>
  )
}

