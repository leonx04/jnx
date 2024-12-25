import { useState, useEffect } from 'react'
import { database } from '@/firebaseConfig'
import { ref, query, orderByChild, equalTo, get } from 'firebase/database'
import ProductCard from './ProductCard'

interface Product {
    id: string
    brand: string
    category: string
    name: string
    price: number
    salePrice: number
    imageUrl: string
    availableStock: number
}

interface RelatedProductsProps {
    currentProductId: string
    currentProductBrand: string
    currentProductCategory: string
}

export default function RelatedProducts({ currentProductId, currentProductBrand, currentProductCategory }: RelatedProductsProps) {
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            const productsRef = ref(database, 'products')
            const brandQuery = query(productsRef, orderByChild('brand'), equalTo(currentProductBrand))
            const snapshot = await get(brandQuery)

            if (snapshot.exists()) {
                const products = Object.values(snapshot.val()) as Product[]
                const filtered = products
                    .filter(product =>
                        product.id !== currentProductId &&
                        product.category === currentProductCategory
                    )
                    .slice(0, 4) // Limit to 4 related products
                setRelatedProducts(filtered)
            }
        }

        fetchRelatedProducts()
    }, [currentProductId, currentProductBrand, currentProductCategory])

    if (relatedProducts.length === 0) {
        return null
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}

