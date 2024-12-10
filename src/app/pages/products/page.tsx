'use client'

import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { database } from '@/firebaseConfig';
import ProductCard from '@/app/components/ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  category: string;
  brand: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  availableStock: number;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  useEffect(() => {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]) => ({
          id,
          ...(product as Omit<Product, 'id'>)
        }));
        setProducts(productsArray);
      }
    });
  }, []);

  const categories = [...new Set(products.map(product => product.category))];
  const brands = [...new Set(products.map(product => product.brand))];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(filter.toLowerCase()) &&
    (categoryFilter === '' || product.category === categoryFilter) &&
    (brandFilter === '' || product.brand === brandFilter)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách sản phẩm</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          className="flex-grow p-2 border border-gray-300 rounded"
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          className="p-2 border border-gray-300 rounded"
          onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          className="p-2 border border-gray-300 rounded"
          onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="">Tất cả thương hiệu</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;

