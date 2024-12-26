'use client'

import { useAuthContext } from '@/app/context/AuthContext'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { database } from '@/firebaseConfig'
import { child, onValue, push, ref, runTransaction, serverTimestamp } from 'firebase/database'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Comment {
    id: string
    content: string
    author: string
    authorId: string
    createdAt: string
}

interface CommentSectionProps {
    blogPostId: string
}

export function CommentSection({ blogPostId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const { user } = useAuthContext()
    const router = useRouter()
    const [isRouterReady, setIsRouterReady] = useState(false)

    useEffect(() => {
        setIsRouterReady(true)
    }, [])

    useEffect(() => {
        const commentsRef = ref(database, `blogPosts/${blogPostId}/comments`)
        const unsubscribe = onValue(commentsRef, (snapshot) => {
            const commentsData = snapshot.val()
            if (commentsData) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                // eslint-disable-next-line
                const commentsArray = Object.entries(commentsData).map(([id, comment]: [string, any]) => ({
                    id,
                    ...comment,
                }))
                setComments(commentsArray)
            } else {
                setComments([])
            }
        })

        return () => unsubscribe()
    }, [blogPostId])

    const handleSubmitComment = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để bình luận')
            if (isRouterReady) {
                router.push('/pages/login')
            }
            return
        }

        if (!newComment.trim()) return

        const blogPostRef = ref(database, `blogPosts/${blogPostId}`)

        try {
            await runTransaction(blogPostRef, (post) => {
                if (post) {
                    if (!post.comments) {
                        post.comments = {}
                    }
                    const newCommentKey = push(child(blogPostRef, 'comments')).key
                    if (newCommentKey) {
                        post.comments[newCommentKey] = {
                            content: newComment,
                            author: user.name || 'Anonymous',
                            authorId: user.id,
                            createdAt: serverTimestamp(),
                        }
                    }
                    post.commentCount = (post.commentCount || 0) + 1
                }
                return post
            })

            setNewComment('')
            toast.success('Bình luận đã được thêm')
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Có lỗi xảy ra khi thêm bình luận')
        }
    }

    return (
        <div className="w-full space-y-4">
            <h3 className="text-lg font-semibold">Bình luận</h3>
            <div className="space-y-4">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-4">
                        <Avatar>
                            <AvatarFallback>{comment.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{comment.author}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleString('vi-VN')}
                            </p>
                            <p className="text-sm">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
            {user ? (
                <div className="space-y-2">
                    <Textarea
                        placeholder="Viết bình luận của bạn..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button onClick={handleSubmitComment}>Gửi bình luận</Button>
                </div>
            ) : (
                <div className="text-center p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">
                        Vui lòng đăng nhập để bình luận
                    </p>
                    {isRouterReady && (
                        <Button
                            onClick={() => router.push('/pages/login')}
                            variant="outline"
                        >
                            Đăng nhập
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

