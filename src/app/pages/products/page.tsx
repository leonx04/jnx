'use client'

import ProductCard from '@/app/components/ProductCard';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { database } from '@/firebaseConfig';
import { onValue, ref } from "firebase/database";
import { useEffect, useMemo, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  brand: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  availableStock: number;
  yearReleased: number;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [saleFilter, setSaleFilter] = useState<'all' | 'sale' | 'regular'>('all');
  const [sortOption, setSortOption] = useState<string>('newest');

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]) => ({
          id,
          ...(product as Omit<Product, 'id'>)
        }));
        setProducts(productsArray);
      }
    });

    return () => unsubscribe();
  }, []);

  const brands = useMemo(() => [...new Set(products.map(product => product.brand))], [products]);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(product =>
        product.name.toLowerCase().includes(filter.toLowerCase()) &&
        (brandFilter.length === 0 || brandFilter.includes(product.brand)) &&
        (saleFilter === 'all' || 
         (saleFilter === 'sale' && product.salePrice && product.salePrice < product.price) ||
         (saleFilter === 'regular' && (!product.salePrice || product.salePrice >= product.price)))
      )
      .sort((a, b) => {
        switch (sortOption) {
          case 'priceAsc':
            return (a.salePrice || a.price) - (b.salePrice || b.price);
          case 'priceDesc':
            return (b.salePrice || b.price) - (a.salePrice || a.price);
          case 'nameAsc':
            return a.name.localeCompare(b.name);
          case 'nameDesc':
            return b.name.localeCompare(a.name);
          case 'newest':
            return b.yearReleased - a.yearReleased;
          case 'oldest':
            return a.yearReleased - b.yearReleased;
          default:
            return 0;
        }
      });
  }, [products, filter, brandFilter, saleFilter, sortOption]);

  const handleBrandFilterChange = (brand: string) => {
    setBrandFilter(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách sản phẩm</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          className="flex-grow"
          onChange={(e) => setFilter(e.target.value)}
        />
        <Select onValueChange={(value) => setSaleFilter(value as 'all' | 'sale' | 'regular')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái giá" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="sale">Đang giảm giá</SelectItem>
            <SelectItem value="regular">Giá thường</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setSortOption(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="priceAsc">Giá tăng dần</SelectItem>
            <SelectItem value="priceDesc">Giá giảm dần</SelectItem>
            <SelectItem value="nameAsc">Tên A-Z</SelectItem>
            <SelectItem value="nameDesc">Tên Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
        {brands.map(brand => (
          <div key={brand} className="flex items-center">
            <Checkbox
              id={`brand-${brand}`}
              checked={brandFilter.includes(brand)}
              onCheckedChange={() => handleBrandFilterChange(brand)}
            />
            <Label htmlFor={`brand-${brand}`} className="ml-2">
              {brand}
            </Label>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;

