'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faShoppingCart, faStar, faShieldAlt, faUndo, faTruck,
  faWeight, faRulerHorizontal, faRulerVertical, faGripLines,
  faPalette, faCompressArrowsAlt, faBalanceScale, faBolt,
  faHandPaper, faCalendarAlt, faGlobe, faTrophy, faUser,
  faCogs, faCheck
} from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthContext } from '@/app/context/AuthContext'
import { database } from '@/firebaseConfig'
import { ref, push, set, get, query, orderByChild, equalTo, onValue } from "firebase/database"

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

export default function ProductDetails() {
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const { user } = useAuthContext()
  const params = useParams()

  useEffect(() => {
    const productsRef = ref(database, 'products')
    const productQuery = query(productsRef, orderByChild('id'), equalTo(params.id as string))
    
    onValue(productQuery, (snapshot) => {
      if (snapshot.exists()) {
        const productData = Object.values(snapshot.val())[0] as Product
        setProduct(productData)
      } else {
        console.log("Không tìm thấy sản phẩm với ID đã cho")
        // Có thể chuyển hướng người dùng đến trang 404 hoặc trang danh sách sản phẩm
        // router.push('/404') hoặc router.push('/pages/products')
      }
    })
  }, [params.id])

  const handleAddToCart = async () => {
    if (user && product) {
      setIsAdding(true)
      const cartRef = ref(database, `carts/${user.email.replace('.', ',')}`)
      const snapshot = await get(cartRef)
      const existingCart = snapshot.val() || {}
      
      const existingItem = Object.entries(existingCart).find(([_, item]: [string, any]) => item.productId === product.id)
      
      if (existingItem) {
        const [key, item] = existingItem
        set(ref(database, `carts/${user.email.replace('.', ',')}/${key}`), {
          ...item,
          quantity: item.quantity + quantity
        })
      } else {
        push(cartRef, {
          name: product.name,
          price: product.salePrice,
          quantity: quantity,
          imageUrl: product.imageUrl,
          productId: product.id 
        })
      }
      
      console.log(`Đã thêm ${quantity} ${product.name} vào giỏ hàng`)
      setTimeout(() => setIsAdding(false), 500)
    } else {
      console.log('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.')
    }
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Đang tải...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Image src={product.imageUrl} alt={product.name} width={500} height={500} className="w-full h-auto object-cover rounded-lg shadow-lg" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <FontAwesomeIcon key={i} icon={faStar} className={i < product.rating ? "text-yellow-400" : "text-gray-300"} />
            ))}
            <span className="ml-2 text-gray-600">({product.reviewCount} đánh giá)</span>
          </div>
          <p className="text-2xl font-bold mb-4">{product.salePrice.toLocaleString('vi-VN')} ₫</p>
          {product.salePrice < product.price && (
            <p className="text-lg text-gray-500 line-through mb-4">{product.price.toLocaleString('vi-VN')} ₫</p>
          )}
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
              onClick={() => setQuantity(quantity + 1)}
              className="bg-gray-200 px-3 py-1 rounded-r"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <ul className="grid grid-cols-2 gap-4">
                <li><FontAwesomeIcon icon={faWeight} className="mr-2" /> Trọng lượng: {product.weight}</li>
                <li><FontAwesomeIcon icon={faRulerHorizontal} className="mr-2" /> Kích thước đầu vợt: {product.headSize}</li>
                <li><FontAwesomeIcon icon={faRulerVertical} className="mr-2" /> Chiều dài: {product.length}</li>
                <li><FontAwesomeIcon icon={faGripLines} className="mr-2" /> Kích thước cán: {product.gripSize}</li>
                <li><FontAwesomeIcon icon={faPalette} className="mr-2" /> Màu sắc: {product.color}</li>
                <li><FontAwesomeIcon icon={faCompressArrowsAlt} className="mr-2" /> Mẫu dây: {product.stringPattern}</li>
                <li><FontAwesomeIcon icon={faBalanceScale} className="mr-2" /> Trọng lượng swing: {product.swingWeight}</li>
                <li><FontAwesomeIcon icon={faBolt} className="mr-2" /> Mức độ lực: {product.powerLevel}</li>
                <li><FontAwesomeIcon icon={faHandPaper} className="mr-2" /> Mức độ thoải mái: {product.comfortLevel}</li>
                <li><FontAwesomeIcon icon={faCalendarAlt} className="mr-2" /> Năm ra mắt: {product.yearReleased}</li>
                <li><FontAwesomeIcon icon={faShieldAlt} className="mr-2" /> Bảo hành: {product.warranty}</li>
                <li><FontAwesomeIcon icon={faGlobe} className="mr-2" /> Xuất xứ: {product.origin}</li>
                <li><FontAwesomeIcon icon={faTrophy} className="mr-2" /> Xếp hạng bán chạy: {product.bestSellerRank}</li>
                <li><FontAwesomeIcon icon={faUser} className="mr-2" /> Loại người chơi: {product.playerType}</li>
                <li><FontAwesomeIcon icon={faCogs} className="mr-2" /> Độ cứng: {product.stiffness}</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="features">
          <Card>
            <CardContent className="pt-6">
              <ul className="list-disc pl-5">
                {product.features.map((feature, index) => (
                  <li key={index} className="mb-2">
                    <FontAwesomeIcon icon={faCheck} className="mr-2 text-green-500" />
                    {feature}
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

