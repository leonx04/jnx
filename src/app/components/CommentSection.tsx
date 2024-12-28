'use client'

// Import các thư viện cần thiết
import { useAuthContext } from '@/app/context/AuthContext' // Lấy thông tin người dùng từ AuthContext
import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Dùng Avatar để hiển thị ảnh đại diện
import { Button } from "@/components/ui/button" // Dùng Button để hiển thị nút
import { Textarea } from "@/components/ui/textarea" // Dùng Textarea để nhập bình luận
import { database } from '@/firebaseConfig' // Kết nối với Firebase
import { child, onValue, push, ref, runTransaction, serverTimestamp } from 'firebase/database' // Các phương thức Firebase để đọc và ghi dữ liệu
import { useRouter } from 'next/navigation' // Dùng router để điều hướng
import { useEffect, useState } from 'react' // Hook của React
import { toast } from 'react-hot-toast' // Dùng để hiển thị thông báo

// Định nghĩa kiểu dữ liệu cho Comment
interface Comment {
    id: string
    content: string
    author: string
    authorId: string
    createdAt: string
}

// Định nghĩa props cho CommentSection
interface CommentSectionProps {
    blogPostId: string // ID của bài viết
}

// Component chính hiển thị phần bình luận
export function CommentSection({ blogPostId }: CommentSectionProps) {
    // Các state cần thiết
    const [comments, setComments] = useState<Comment[]>([]) // Danh sách bình luận
    const [newComment, setNewComment] = useState('') // Bình luận mới
    const { user } = useAuthContext() // Lấy thông tin người dùng từ context
    const router = useRouter() // Sử dụng router để điều hướng
    const [isRouterReady, setIsRouterReady] = useState(false) // Kiểm tra xem router đã sẵn sàng chưa

    // Effect để set router ready sau khi component mount
    useEffect(() => {
        setIsRouterReady(true)
    }, [])

    // Effect để lấy danh sách bình luận từ Firebase khi blogPostId thay đổi
    useEffect(() => {
        const commentsRef = ref(database, `blogPosts/${blogPostId}/comments`) // Truy cập vào phần comments của bài viết
        const unsubscribe = onValue(commentsRef, (snapshot) => {
            const commentsData = snapshot.val() // Lấy dữ liệu bình luận
            if (commentsData) {
                // Chuyển dữ liệu từ Firebase thành mảng
                const commentsArray = Object.entries(commentsData).map(([id, comment]: [string, any]) => ({
                    id,
                    ...comment,
                }))
                setComments(commentsArray) // Cập nhật state với danh sách bình luận
            } else {
                setComments([]) // Nếu không có bình luận, set lại là mảng rỗng
            }
        })

        return () => unsubscribe() // Hủy đăng ký khi component unmount
    }, [blogPostId])

    // Hàm xử lý gửi bình luận
    const handleSubmitComment = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để bình luận') // Nếu người dùng chưa đăng nhập, hiển thị thông báo
            if (isRouterReady) {
                router.push('/pages/login') // Chuyển hướng người dùng đến trang đăng nhập
            }
            return
        }

        if (!newComment.trim()) return // Nếu bình luận rỗng, không làm gì

        const blogPostRef = ref(database, `blogPosts/${blogPostId}`) // Tham chiếu đến bài viết trong Firebase

        try {
            // Chạy giao dịch để thêm bình luận vào Firebase
            await runTransaction(blogPostRef, (post) => {
                if (post) {
                    if (!post.comments) {
                        post.comments = {} // Nếu chưa có comments, tạo mảng trống
                    }
                    const newCommentKey = push(child(blogPostRef, 'comments')).key // Lấy key mới cho bình luận
                    if (newCommentKey) {
                        // Thêm bình luận mới vào Firebase
                        post.comments[newCommentKey] = {
                            content: newComment,
                            author: user.name || 'Anonymous',
                            authorId: user.id,
                            createdAt: serverTimestamp(), // Thêm thời gian tạo bình luận
                        }
                    }
                    post.commentCount = (post.commentCount || 0) + 1 // Cập nhật số lượng bình luận của bài viết
                }
                return post
            })

            setNewComment('') // Reset bình luận sau khi gửi thành công
            toast.success('Bình luận đã được thêm') // Hiển thị thông báo thành công
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Có lỗi xảy ra khi thêm bình luận') // Hiển thị thông báo lỗi nếu có vấn đề xảy ra
        }
    }

    return (
        <div className="w-full space-y-4">
            <h3 className="text-lg font-semibold">Bình luận</h3>
            <div className="space-y-4">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-4">
                        {/* Hiển thị Avatar của tác giả bình luận */}
                        <Avatar>
                            <AvatarFallback>{comment.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{comment.author}</p>
                            <p className="text-sm text-gray-500">
                                {/* Hiển thị thời gian tạo bình luận */}
                                {new Date(comment.createdAt).toLocaleString('vi-VN')}
                            </p>
                            <p className="text-sm">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
            {/* Form để người dùng viết bình luận */}
            {user ? (
                <div className="space-y-2">
                    <Textarea
                        placeholder="Viết bình luận của bạn..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)} // Cập nhật nội dung bình luận
                    />
                    <Button onClick={handleSubmitComment}>Gửi bình luận</Button>
                </div>
            ) : (
                // Hiển thị thông báo nếu người dùng chưa đăng nhập
                <div className="text-center p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">
                        Vui lòng đăng nhập để bình luận
                    </p>
                    {isRouterReady && (
                        <Button
                            onClick={() => router.push('/pages/login')} // Chuyển hướng đến trang đăng nhập
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
