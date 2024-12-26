import { useState, useEffect } from 'react'
import { database } from '@/firebaseConfig'
import { onValue, push, ref, serverTimestamp } from 'firebase/database'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Comment {
    id: string
    content: string
    author: string
    createdAt: string
}

interface CommentSectionProps {
    blogPostId: string
}

export function CommentSection({ blogPostId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')

    useEffect(() => {
        const commentsRef = ref(database, `blogPosts/${blogPostId}/comments`)
        const unsubscribe = onValue(commentsRef, (snapshot) => {
            const commentsData = snapshot.val()
            if (commentsData) {
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
        if (!newComment.trim()) return

        const commentsRef = ref(database, `blogPosts/${blogPostId}/comments`)
        await push(commentsRef, {
            content: newComment,
            author: 'Anonymous', // Replace with actual user name when authentication is implemented
            createdAt: serverTimestamp(),
        })

        setNewComment('')
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
                            <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString('vi-VN')}</p>
                            <p className="text-sm">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                <Textarea
                    placeholder="Viết bình luận của bạn..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handleSubmitComment}>Gửi bình luận</Button>
            </div>
        </div>
    )
}

