'use client'

import { useEffect, useState } from 'react'
import { onValue, ref, query, limitToLast, orderByChild } from 'firebase/database'
import { database } from '@/firebaseConfig'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import Link from 'next/link'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface BlogPost {
    id: string
    title: string
    content: string
    imageUrl: string
    author: string
    createdAt: string
}

const POSTS_PER_PAGE = 9

export default function BlogList() {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        const blogPostsRef = ref(database, 'blogPosts')
        const blogPostsQuery = query(blogPostsRef, orderByChild('createdAt'))

        const unsubscribe = onValue(blogPostsQuery, (snapshot) => {
            setLoading(true)
            if (snapshot.exists()) {
                const posts = Object.entries(snapshot.val())
                    .map(([id, post]) => ({
                        id,
                        ...(post as Omit<BlogPost, 'id'>)
                    }))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                setBlogPosts(posts)
                setTotalPages(Math.ceil(posts.length / POSTS_PER_PAGE))
            } else {
                setBlogPosts([])
                setTotalPages(1)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const paginatedPosts = blogPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    )

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

    if (blogPosts.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Bài viết</h1>
                <div className="text-center text-gray-600">
                    Hiện tại chưa có bài viết nào.
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Bài viết</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post) => (
                    <Card key={post.id} className="flex flex-col">
                        <CardHeader>
                            <div className="relative w-full h-48 mb-4">
                                <Image
                                    src={post.imageUrl || '/placeholder.svg'}
                                    alt={post.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-t-lg"
                                />
                            </div>
                            <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                            <CardDescription>{post.author} - {new Date(post.createdAt).toLocaleDateString('vi-VN')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-gray-600 line-clamp-3">{post.content.replace(/<[^>]*>/g, '')}</p>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/pages/blogs/${post.id}`} passHref>
                                <Button className="w-full">Đọc thêm</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
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
        </div>
    )
}

