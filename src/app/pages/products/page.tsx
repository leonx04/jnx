'use client'

import NoResultsFound from '@/app/components/NoResultsFound'
import ProductCard from '@/app/components/ProductCard'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { database } from '@/firebaseConfig'
import { onValue, ref } from "firebase/database"
import { Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface Product {
  id: string
  name: string
  price: number
  salePrice: number
  brand: string
  imageUrl: string
  rating: number
  reviewCount: number
  availableStock: number
  yearReleased: number
}

const ITEMS_PER_PAGE = 12

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState<string[]>([])
  const [saleFilter, setSaleFilter] = useState<'all' | 'sale' | 'regular'>('all')
  const [sortOption, setSortOption] = useState<string>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    const productsRef = ref(database, 'products')
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]) => ({
          id,
          ...(product as Omit<Product, 'id'>)
        }))
        setProducts(productsArray)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const sortParam = searchParams.get('sort')
    if (sortParam) {
      switch (sortParam) {
        case 'newest':
          setSortOption('newest')
          break
        case 'discount':
          setSortOption('priceDesc')
          setSaleFilter('sale')
          break
        case 'priceAsc':
          setSortOption('priceAsc')
          break
        default:
          setSortOption('newest')
      }
    }
  }, [searchParams])

  const brands = useMemo(() => [...new Set(products.map(product => product.brand))], [products])

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(product =>
        product.name.toLowerCase().includes(filter.toLowerCase()) &&
        (brandFilter.length === 0 || brandFilter.includes(product.brand)) &&
        (saleFilter === 'all' ||
          (saleFilter === 'sale' && product.salePrice < product.price) ||
          (saleFilter === 'regular' && product.salePrice >= product.price))
      )
      .sort((a, b) => {
        switch (sortOption) {
          case 'priceAsc':
            return (a.salePrice || a.price) - (b.salePrice || b.price)
          case 'priceDesc':
            return (b.salePrice || b.price) - (a.salePrice || a.price)
          case 'nameAsc':
            return a.name.localeCompare(b.name)
          case 'nameDesc':
            return b.name.localeCompare(a.name)
          case 'newest':
            return b.yearReleased - a.yearReleased
          case 'oldest':
            return a.yearReleased - b.yearReleased
          default:
            return 0
        }
      })
  }, [products, filter, brandFilter, saleFilter, sortOption])

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE)

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedProducts, currentPage])

  const handleBrandFilterChange = useCallback((brand: string) => {
    setBrandFilter(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const FilterContent = useCallback(() => (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="search">Tìm kiếm sản phẩm</Label>
          <div className="relative mt-1">
            <Input
              id="search"
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                handleFilterChange()
              }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
        <div>
          <Label>Trạng thái giá</Label>
          <Select value={saleFilter} onValueChange={(value: 'all' | 'sale' | 'regular') => {
            setSaleFilter(value)
            handleFilterChange()
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái giá" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="sale">Đang giảm giá</SelectItem>
              <SelectItem value="regular">Giá thường</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sắp xếp</Label>
          <Select value={sortOption} onValueChange={(value) => {
            setSortOption(value)
            handleFilterChange()
          }}>
            <SelectTrigger>
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
        <div>
          <Label>Thương hiệu</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto mt-1">
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
        </div>
      </div>
    </>
  ), [filter, saleFilter, sortOption, brands, brandFilter, handleBrandFilterChange, handleFilterChange])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách sản phẩm</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4">
          <div className="hidden lg:block sticky top-20 overflow-y-auto max-h-[calc(100vh-5rem)]">
            <FilterContent />
          </div>
          <div className="lg:hidden mb-4">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  handleFilterChange()
                }}
              />
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <SlidersHorizontal className="mr-2" size={20} />
                    Lọc
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Lọc và Sắp xếp</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </aside>
        <main className="lg:w-3/4">
          {paginatedProducts.length === 0 ? (
            <NoResultsFound />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

