'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onValue, ref } from 'firebase/database'
import { database } from '@/firebaseConfig'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { Editor } from '@tinymce/tinymce-react'
import { use } from 'react'

interface BlogPost {
    id: string
    title: string
    content: string
    imageUrl: string
    author: string
    createdAt: string
}

export default function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const blogPostRef = ref(database, `blogPosts/${id}`)
        const unsubscribe = onValue(blogPostRef, (snapshot) => {
            setLoading(true)
            if (snapshot.exists()) {
                const post = snapshot.val()
                setBlogPost({ id, ...post })
            } else {
                setBlogPost(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [id])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                </div>
            </div>
        )
    }

    if (!blogPost) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-gray-600">
                    Không tìm thấy bài viết.
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Button onClick={() => router.push('/pages/blogs')} className="mb-4">
                &larr; Quay lại danh sách bài viết
            </Button>
            <Card>
                <CardHeader>
                    <div className="relative w-full h-64 mb-4">
                        <Image
                            src={blogPost.imageUrl || '/placeholder.svg'}
                            alt={blogPost.title}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-t-lg"
                        />
                    </div>
                    <CardTitle className="text-3xl">{blogPost.title}</CardTitle>
                    <CardDescription>
                        {blogPost.author} - {new Date(blogPost.createdAt).toLocaleDateString('vi-VN')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Editor
                        apiKey="cmj5p60uvixd7y0x0iti6mxger3oixjocnciurpugwt6oezv"
                        initialValue={blogPost.content}
                        init={{
                            height: 500,
                            menubar: false,
                            plugins: [],
                            toolbar: false,
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                            disabled: true
                        }}
                    />
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push('/pages/blogs')} className="w-full">
                        Quay lại danh sách bài viết
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

