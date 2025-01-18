import { database } from '@/lib/firebaseConfig'; // Nhập cấu hình Firebase
import { equalTo, get, orderByChild, query, ref } from 'firebase/database'; // Nhập các hàm thao tác với cơ sở dữ liệu Firebase
import { useEffect, useState } from 'react'; // Nhập các hook useState và useEffect từ React
import ProductCard from './ProductCard'; // Nhập thành phần ProductCard để hiển thị sản phẩm

// Định nghĩa interface cho sản phẩm
interface Product {
    id: string  // ID của sản phẩm
    brand: string  // Thương hiệu của sản phẩm
    category: string  // Danh mục của sản phẩm
    name: string  // Tên sản phẩm
    price: number  // Giá gốc của sản phẩm
    salePrice: number  // Giá bán của sản phẩm (có thể là giá khuyến mãi)
    imageUrl: string  // URL của hình ảnh sản phẩm
    availableStock: number  // Số lượng hàng còn trong kho
}

// Định nghĩa interface cho props của component RelatedProducts
interface RelatedProductsProps {
    currentProductId: string  // ID của sản phẩm hiện tại
    currentProductBrand: string  // Thương hiệu của sản phẩm hiện tại
    currentProductCategory: string  // Danh mục của sản phẩm hiện tại
}

export default function RelatedProducts({ currentProductId, currentProductBrand, currentProductCategory }: RelatedProductsProps) {
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])  // Khởi tạo state để lưu trữ danh sách sản phẩm liên quan

    useEffect(() => {
        // Hàm bất đồng bộ để lấy các sản phẩm liên quan từ Firebase
        const fetchRelatedProducts = async () => {
            const productsRef = ref(database, 'products')  // Tham chiếu tới bảng 'products' trong Firebase
            const brandQuery = query(productsRef, orderByChild('brand'), equalTo(currentProductBrand))  // Tạo query lọc sản phẩm theo thương hiệu
            const snapshot = await get(brandQuery)  // Lấy snapshot của dữ liệu từ Firebase

            // Kiểm tra nếu có dữ liệu trả về
            if (snapshot.exists()) {
                const products = Object.values(snapshot.val()) as Product[]  // Chuyển đổi dữ liệu trả về thành mảng các sản phẩm
                const filtered = products
                    .filter(product =>  // Lọc các sản phẩm có cùng thương hiệu và thuộc cùng danh mục nhưng không phải là sản phẩm hiện tại
                        product.id !== currentProductId &&
                        product.category === currentProductCategory
                    )
                    .slice(0, 4)  // Giới hạn số lượng sản phẩm liên quan là 4
                setRelatedProducts(filtered)  // Cập nhật state với danh sách sản phẩm liên quan
            }
        }

        fetchRelatedProducts()  // Gọi hàm để lấy sản phẩm liên quan khi component được render

    }, [currentProductId, currentProductBrand, currentProductCategory])  // Phụ thuộc vào ID, thương hiệu và danh mục của sản phẩm hiện tại

    if (relatedProducts.length === 0) {
        return null  // Nếu không có sản phẩm liên quan, không hiển thị gì
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map(product => (  // Duyệt qua danh sách sản phẩm liên quan và hiển thị chúng bằng thành phần ProductCard
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}
