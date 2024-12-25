'use client'

import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { database } from '@/firebaseConfig'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import Link from 'next/link'

interface BlogPost {
    id: string
    title: string
    description: string
    imageUrl: string
    author: string
    createdAt: string
}

export default function BlogList() {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const blogPostsRef = ref(database, 'blogPosts')
        const unsubscribe = onValue(blogPostsRef, (snapshot) => {
            setLoading(true)
            if (snapshot.exists()) {
                const posts = Object.entries(snapshot.val()).map(([id, post]) => ({
                    id,
                    ...(post as Omit<BlogPost, 'id'>)
                }))
                setBlogPosts(posts)
            } else {
                setBlogPosts([])
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

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
                {blogPosts.map((post) => (
                    <Card key={post.id} className="flex flex-col">
                        <CardHeader>
                            <div className="relative w-full h-48 mb-4">
                                <Image
                                    src={post.imageUrl}
                                    alt={post.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-t-lg"
                                />
                            </div>
                            <CardTitle>{post.title}</CardTitle>
                            <CardDescription>{post.author} - {new Date(post.createdAt).toLocaleDateString('vi-VN')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-gray-600">{post.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/blogs/${post.id}`} passHref>
                                <Button className="w-full">Đọc thêm</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

