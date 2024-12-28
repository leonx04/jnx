// File: blog-list.tsx
// Mô tả: Component hiển thị danh sách các bài viết blog

'use client'

// Import các dependencies và components cần thiết
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { database } from '@/firebaseConfig'
import { onValue, query, ref } from 'firebase/database'
import { Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Định nghĩa interface cho cấu trúc bài viết
interface BlogPost {
    id: string
    title: string
    imageUrl: string
    author: string
    createdAt: string
    isHidden: boolean
}

// Số lượng bài viết hiển thị trên mỗi trang
const POSTS_PER_PAGE = 9

// Component chính
export default function BlogList() {
    // Khởi tạo các state
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

    // Sử dụng useEffect để fetch dữ liệu bài viết khi component mount
    useEffect(() => {
        const blogPostsRef = ref(database, 'blogPosts')
        const blogPostsQuery = query(blogPostsRef)

        const unsubscribe = onValue(blogPostsQuery, (snapshot) => {
            setLoading(true)
            if (snapshot.exists()) {
                const posts = Object.entries(snapshot.val())
                    .map(([id, post]) => ({
                        id,
                        ...(post as Omit<BlogPost, 'id'>)
                    }))
                    .filter(post => !post.isHidden)
                setBlogPosts(posts)
            } else {
                setBlogPosts([])
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Lọc và sắp xếp bài viết dựa trên searchTerm và sortOrder
    const filteredAndSortedPosts = blogPosts
        .filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })

    // Phân trang các bài viết
    const paginatedPosts = filteredAndSortedPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    )

    // Cập nhật tổng số trang khi filteredAndSortedPosts thay đổi
    useEffect(() => {
        setTotalPages(Math.ceil(filteredAndSortedPosts.length / POSTS_PER_PAGE))
        setCurrentPage(1)
    }, [filteredAndSortedPosts.length])

    // Hiển thị loading khi đang tải dữ liệu
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Bài viết</h1>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                </div>
            </div>
        )
    }

    // Render component
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <h1 className="text-3xl font-bold">Bài viết</h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    {/* Input tìm kiếm */}
                    <div className="relative w-full sm:w-auto">
                        <Input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-4 py-2 w-full sm:w-48"
                        />
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    {/* Select sắp xếp */}
                    <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Sắp xếp" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Mới nhất</SelectItem>
                            <SelectItem value="oldest">Cũ nhất</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {filteredAndSortedPosts.length === 0 ? (
                // Hiển thị thông báo khi không có bài viết
                <div className="text-center text-gray-600 mt-8">
                    Không tìm thấy bài viết nào.
                </div>
            ) : (
                <>
                    {/* Grid hiển thị các bài viết */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedPosts.map((post) => (
                            <Card key={post.id} className="flex flex-col">
                                <CardHeader className="p-0">
                                    <div className="relative w-full pt-[56.25%]">
                                        <Image
                                            src={post.imageUrl || '/placeholder.svg'}
                                            alt={post.title}
                                            layout="fill"
                                            objectFit="cover"
                                            className="rounded-t-lg"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow p-4">
                                    <CardTitle className="line-clamp-2 text-lg mb-2">{post.title}</CardTitle>
                                    <CardDescription className="text-sm text-gray-500">
                                        {post.author} - {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                    </CardDescription>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Link href={`/pages/blogs/${post.id}`} passHref className="w-full">
                                        <Button className="w-full">Đọc thêm</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {/* Phân trang */}
                    <Pagination className="mt-8">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href="#"
                                        onClick={() => setCurrentPage(i + 1)}
                                        isActive={currentPage === i + 1}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={() => {
                                        if (currentPage < totalPages) {
                                            setCurrentPage(prev => prev + 1)
                                        }
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </>
            )}
        </div>
    )
}
