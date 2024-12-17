import { faArrowRight, faFire } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { onValue, ref } from 'firebase/database';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { database } from '../../firebaseConfig';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  brand: string;
  bestSellerRank: number;
  availableStock: number;
}

export default function BestSellers() {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data)
          .map(([id, product]) => ({
            id,
            ...(product as Omit<Product, 'id'>),
          }))
          .filter((product) => product.bestSellerRank <= 4)
          .sort((a, b) => a.bestSellerRank - b.bestSellerRank);
        setBestSellers(productsArray);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="my-16">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold flex items-center">
            <FontAwesomeIcon icon={faFire} className="text-red-500 mr-4" />
            Sản phẩm bán chạy
          </h2>
          <Link href="/pages/products?sort=best-sellers" className="btn-primary">
            Xem tất cả
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {bestSellers.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

