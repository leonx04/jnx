'use client'

import React, { useState } from 'react';
import Link from 'next/link';

const products = [
  { id: 1, name: 'Áo thun nam', price: 250000, category: 'Quần áo' },
  { id: 2, name: 'Giày thể thao', price: 800000, category: 'Giày dép' },
  { id: 3, name: 'Túi xách nữ', price: 550000, category: 'Phụ kiện' },
  { id: 4, name: 'Đồng hồ thông minh', price: 2500000, category: 'Điện tử' },
  { id: 5, name: 'Nước hoa', price: 1200000, category: 'Mỹ phẩm' },
  { id: 6, name: 'Máy ảnh DSLR', price: 15000000, category: 'Điện tử' },
];

const ProductsPage = () => {
  const [filter, setFilter] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(filter.toLowerCase()) ||
    product.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách sản phẩm</h1>
      <input
        type="text"
        placeholder="Tìm kiếm sản phẩm..."
        className="w-full p-2 mb-4 border border-gray-300 rounded"
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            <p className="text-gray-600 mb-2">Loại: {product.category}</p>
            <p className="text-gray-600 mb-4">Giá: {product.price.toLocaleString('vi-VN')} VNĐ</p>
            <Link href={`/products/${product.id}`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-block">
              Xem chi tiết
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;

