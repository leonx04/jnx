'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { database } from '@/firebaseConfig'
import { onValue, ref, update, get, runTransaction } from 'firebase/database'
import { CalendarIcon, UserIcon, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { CommentSection } from '@/app/components/CommentSection'
import { LikeDislikeButtons } from '@/app/components/LikeDislikeButtons'
import { Separator } from "@/components/ui/separator"
import { useAuthContext } from '@/app/context/AuthContext'
import { toast } from 'react-hot-toast'

interface BlogPost {
    id: string
    title: string
    content: string
    imageUrl: string
    author: string
    createdAt: string
    likeCount?: number
    dislikeCount?: number
    commentCount?: number
    likes?: { [userId: string]: boolean }
    dislikes?: { [userId: string]: boolean }
}

export default function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const { user } = useAuthContext()

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

    const handleLikeDislike = async (action: 'like' | 'dislike') => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thực hiện hành động này')
            router.push('/pages/login')
            return
        }

        if (!blogPost) return

        const blogPostRef = ref(database, `blogPosts/${id}`)

        await runTransaction(blogPostRef, (currentPost) => {
            if (!currentPost) {
                return null
            }

            const oppositeAction = action === 'like' ? 'dislike' : 'like'

            // Ensure the action fields exist
            if (!currentPost[`${action}s`]) currentPost[`${action}s`] = {}
            if (!currentPost[`${oppositeAction}s`]) currentPost[`${oppositeAction}s`] = {}

            if (user?.id && currentPost[`${action}s`]?.[user.id]) {
                // User is un-liking or un-disliking
                currentPost[`${action}Count`] = ((currentPost[`${action}Count`] || 0) - 1) || 0
                currentPost[`${action}s`][user.id] = null
            } else if (user?.id) {
                // User is liking or disliking
                currentPost[`${action}Count`] = (currentPost[`${action}Count`] || 0) + 1
                currentPost[`${action}s`][user.id] = true

                // Remove opposite action if exists
                if (currentPost[`${oppositeAction}s`]?.[user.id]) {
                    currentPost[`${oppositeAction}Count`] = ((currentPost[`${oppositeAction}Count`] || 0) - 1) || 0
                    currentPost[`${oppositeAction}s`][user.id] = null
                }
            }

            return currentPost
        })
    }

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
            <Card className="overflow-hidden shadow-lg">
                <div className="md:flex md:items-start">
                    <div className="md:w-1/3 p-4">
                        <div className="relative w-full pt-[75%]">
                            <Image
                                src={blogPost.imageUrl || '/placeholder.svg'}
                                alt={blogPost.title}
                                layout="fill"
                                objectFit="cover"
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="md:w-2/3">
                        <CardHeader>
                            <CardTitle className="text-2xl md:text-3xl mb-2">{blogPost.title}</CardTitle>
                            <CardDescription className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                    <UserIcon className="mr-1 h-4 w-4" />
                                    {blogPost.author}
                                </span>
                                <span className="flex items-center">
                                    <CalendarIcon className="mr-1 h-4 w-4" />
                                    {new Date(blogPost.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                            </CardDescription>
                        </CardHeader>
                    </div>
                </div>
                <CardContent className="prose max-w-none px-4 py-6">
                    <div dangerouslySetInnerHTML={{ __html: blogPost.content }} />
                </CardContent>
                <Separator className="my-4" />
                <CardFooter className="flex flex-col items-start space-y-4 bg-gray-50 p-4">
                    <div className="flex items-center justify-between w-full">
                        <LikeDislikeButtons
                            likeCount={blogPost.likeCount || 0}
                            dislikeCount={blogPost.dislikeCount || 0}
                            onLike={() => handleLikeDislike('like')}
                            onDislike={() => handleLikeDislike('dislike')}
                            userLiked={user && user.id ? blogPost.likes?.[user.id] || false : false}
                            userDisliked={user && user.id ? blogPost.dislikes?.[user.id] || false : false}
                        />
                        <div className="flex items-center space-x-2">
                            <MessageCircle className="h-5 w-5 text-gray-500" />
                            <span className="text-sm text-gray-500">{blogPost.commentCount || 0} bình luận</span>
                        </div>
                    </div>
                    <CommentSection blogPostId={id} />
                </CardFooter>
            </Card>
        </div>
    )
}

