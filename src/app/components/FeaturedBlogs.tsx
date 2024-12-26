'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { database } from '@/firebaseConfig'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { limitToLast, onValue, orderByChild, query, ref } from 'firebase/database'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface BlogPost {
    id: string
    title: string
    imageUrl: string
    author: string
    createdAt: string
    isHidden: boolean
}

export default function FeaturedBlogs() {
    const [latestBlogs, setLatestBlogs] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const blogPostsRef = ref(database, 'blogPosts')
        const latestBlogsQuery = query(blogPostsRef, orderByChild('createdAt'), limitToLast(10))

        const unsubscribe = onValue(latestBlogsQuery, (snapshot) => {
            setLoading(true)
            if (snapshot.exists()) {
                const posts = Object.entries(snapshot.val())
                    .map(([id, post]) => ({
                        id,
                        ...(post as Omit<BlogPost, 'id'>)
                    }))
                    .filter(post => !post.isHidden)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3)
                setLatestBlogs(posts)
            } else {
                setLatestBlogs([])
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // If there are fewer than 3 blog posts, create placeholder posts
    const displayBlogs = [...latestBlogs]
    while (displayBlogs.length < 3) {
        displayBlogs.push({
            id: `placeholder-${displayBlogs.length}`,
            title: 'Bài viết sắp ra mắt',
            imageUrl: '/placeholder.svg',
            author: 'JNX Tennis Store',
            createdAt: new Date().toISOString(),
            isHidden: false
        })
    }

    return (
        <section className="my-16">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">Bài viết mới nhất</h2>
                    <Link href="/pages/blogs" passHref>
                        <Button variant="outline">
                            Xem tất cả
                            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                        </Button>
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {displayBlogs.map((post) => (
                        <Card key={post.id} className="flex flex-col">
                            <CardHeader className="p-0">
                                <div className="relative w-full pt-[56.25%]">
                                    <img
                                        src={post.imageUrl || '/placeholder.svg'}
                                        alt={post.title}
                                        className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
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
                                {post.id.startsWith('placeholder') ? (
                                    <Button className="w-full" disabled>Sắp ra mắt</Button>
                                ) : (
                                    <Link href={`/pages/blogs/${post.id}`} passHref className="w-full">
                                        <Button className="w-full">Đọc thêm</Button>
                                    </Link>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

