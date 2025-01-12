'use client'

import { CommentSection } from '@/app/components/CommentSection'
import { LikeDislikeButtons } from '@/app/components/LikeDislikeButtons'
import { useAuthContext } from '@/app/context/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { database } from '@/firebaseConfig'
import { onValue, ref, runTransaction } from 'firebase/database'
import { CalendarIcon, ChevronLeft, MessageCircle, PauseCircle, PlayCircle, Share2, StopCircle, UserIcon, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { use, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

interface BlogPost {
    id: string
    title: string
    content: string
    imageUrl: string
    author: string
    authorImageUrl?: string
    createdAt: string
    likeCount?: number
    dislikeCount?: number
    commentCount?: number
    likes?: { [userId: string]: boolean }
    dislikes?: { [userId: string]: boolean }
    category?: string
    readTime?: number
    language?: string
}

export default function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
    const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const router = useRouter()
    const { user } = useAuthContext()

    useEffect(() => {
        const loadVoices = () => {
            if (speechSynthesis) {
                const voices = speechSynthesis.getVoices()
                setAvailableVoices(voices)
                if (blogPost?.language) {
                    const matchingVoice = voices.find(voice =>
                        blogPost.language && voice.lang.startsWith(blogPost.language)
                    )
                    if (matchingVoice) setSelectedVoice(matchingVoice)
                }
            }
        }

        if (speechSynthesis) {
            loadVoices()
            speechSynthesis.addEventListener('voiceschanged', loadVoices)
        }

        return () => {
            if (speechSynthesis) {
                speechSynthesis.removeEventListener('voiceschanged', loadVoices)
            }
        }
    }, [blogPost?.language])

    useEffect(() => {
        return () => {
            if (speechSynthesis) {
                speechSynthesis.cancel()
            }
        }
    }, [])

    useEffect(() => {
        const blogPostRef = ref(database, `blogPosts/${id}`)
        const unsubscribe = onValue(blogPostRef, (snapshot) => {
            setLoading(true)
            if (snapshot.exists()) {
                const post = snapshot.val()
                const detectedLanguage = detectLanguage(post.content)
                setBlogPost({
                    id,
                    ...post,
                    language: detectedLanguage,
                    readTime: Math.ceil(post.content.split(' ').length / 200)
                })
            } else {
                setBlogPost(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [id])

    const detectLanguage = (text: string): string => {
        const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
        const ukEnglishPattern = /\b(colour|favour|behaviour|centre)\b/i
        const usEnglishPattern = /\b(color|favor|behavior|center)\b/i

        if (vietnamesePattern.test(text)) return 'vi-VN'
        if (ukEnglishPattern.test(text)) return 'en-GB'
        if (usEnglishPattern.test(text)) return 'en-US'
        return 'en-US'
    }

    const stripHtml = (html: string) => {
        const tmp = document.createElement('div')
        tmp.innerHTML = html
        return tmp.textContent || tmp.innerText || ''
    }

    const handleSpeech = () => {
        if (!speechSynthesis) {
            toast.error('Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản')
            return
        }

        if (isPlaying) {
            speechSynthesis.pause()
            setIsPlaying(false)
            return
        }

        if (speechSynthesis.paused) {
            speechSynthesis.resume()
            setIsPlaying(true)
            return
        }

        const content = stripHtml(blogPost?.content || '')
        utteranceRef.current = new SpeechSynthesisUtterance(content)

        if (selectedVoice) {
            utteranceRef.current.voice = selectedVoice
        }

        utteranceRef.current.rate = 1
        utteranceRef.current.pitch = 1
        utteranceRef.current.volume = isMuted ? 0 : 1

        utteranceRef.current.onend = () => {
            setIsPlaying(false)
        }

        utteranceRef.current.onerror = (event) => {
            console.error('Speech synthesis error:', event)
            toast.error('Có lỗi xảy ra khi đọc văn bản')
            setIsPlaying(false)
        }

        speechSynthesis.speak(utteranceRef.current)
        setIsPlaying(true)
    }

    const handleStop = () => {
        if (speechSynthesis) {
            speechSynthesis.cancel()
            setIsPlaying(false)
        }
    }

    const handleMute = () => {
        setIsMuted(!isMuted)
        if (utteranceRef.current) {
            utteranceRef.current.volume = isMuted ? 1 : 0
        }
    }

    const handleLikeDislike = async (action: 'like' | 'dislike') => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thực hiện hành động này')
            router.push('/pages/login')
            return
        }

        if (!blogPost) return

        const blogPostRef = ref(database, `blogPosts/${id}`)

        await runTransaction(blogPostRef, (currentPost) => {
            if (!currentPost) return null

            const oppositeAction = action === 'like' ? 'dislike' : 'like'

            if (!currentPost[`${action}s`]) currentPost[`${action}s`] = {}
            if (!currentPost[`${oppositeAction}s`]) currentPost[`${oppositeAction}s`] = {}

            if (user?.id && currentPost[`${action}s`]?.[user.id]) {
                currentPost[`${action}Count`] = ((currentPost[`${action}Count`] || 0) - 1) || 0
                currentPost[`${action}s`][user.id] = null
            } else if (user?.id) {
                currentPost[`${action}Count`] = (currentPost[`${action}Count`] || 0) + 1
                currentPost[`${action}s`][user.id] = true

                if (currentPost[`${oppositeAction}s`]?.[user.id]) {
                    currentPost[`${oppositeAction}Count`] = ((currentPost[`${oppositeAction}Count`] || 0) - 1) || 0
                    currentPost[`${oppositeAction}s`][user.id] = null
                }
            }

            return currentPost
        })
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Đã sao chép liên kết bài viết')
    }

    const fetchRelatedPosts = useEffect(() => {
        if (blogPost) {
            const relatedPostsRef = ref(database, 'blogPosts')

            const unsubscribe = onValue(relatedPostsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const posts = Object.entries(snapshot.val())
                        .map(([id, post]) => ({
                            id,
                            ...(post as Omit<BlogPost, 'id'>)
                        }))
                        .filter(post => post.id !== id && post.category === blogPost.category)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 3)
                    setRelatedPosts(posts)
                }
            })

            return () => unsubscribe()
        }
    }, [blogPost, id])

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
                <Card className="text-center p-8">
                    <CardTitle className="mb-4">Không tìm thấy bài viết</CardTitle>
                    <Button onClick={() => router.push('/pages/blogs')}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách bài viết
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/pages/blogs')}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách bài viết
                    </Button>
                    <div className="flex gap-2 flex-wrap">
                        <div className="flex items-center gap-2 bg-white rounded-lg shadow px-3 py-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSpeech}
                                className="w-8 h-8 p-0"
                                title={isPlaying ? 'Tạm dừng' : 'Phát'}
                            >
                                {isPlaying ? (
                                    <PauseCircle className="h-6 w-6" />
                                ) : (
                                    <PlayCircle className="h-6 w-6" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleStop}
                                className="w-8 h-8 p-0"
                                title="Dừng"
                            >
                                <StopCircle className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMute}
                                className="w-8 h-8 p-0"
                                title={isMuted ? 'Bật âm' : 'Tắt âm'}
                            >
                                {isMuted ? (
                                    <VolumeX className="h-6 w-6" />
                                ) : (
                                    <Volume2 className="h-6 w-6" />
                                )}
                            </Button>
                            {availableVoices.length > 0 && (
                                <select
                                    className="text-sm border rounded px-2 py-1"
                                    value={selectedVoice?.name || ''}
                                    onChange={(e) => {
                                        const voice = availableVoices.find(v => v.name === e.target.value)
                                        if (voice) setSelectedVoice(voice)
                                    }}
                                >
                                    {availableVoices.map(voice => (
                                        <option key={voice.name} value={voice.name}>
                                            {voice.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="flex items-center gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Chia sẻ
                        </Button>
                    </div>
                </div>

                <Card className="overflow-hidden shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                    <div className="relative w-full pt-[50%] md:pt-[40%]">
                        <Image
                            src={blogPost.imageUrl || '/placeholder.svg'}
                            alt={blogPost.title}
                            layout="fill"
                            objectFit="cover"
                            className="transition-transform duration-300 hover:scale-105"
                        />
                        {blogPost.category && (
                            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                                {blogPost.category}
                            </span>
                        )}
                    </div>

                    <CardHeader className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                                <UserIcon className="mr-1 h-4 w-4" />
                                {blogPost.author}
                            </span>
                            <span className="flex items-center">
                                <CalendarIcon className="mr-1 h-4 w-4" />
                                {new Date(blogPost.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                            {blogPost.readTime && (
                                <span className="flex items-center">
                                    <span className="mr-1">📚</span>
                                    {blogPost.readTime} phút đọc
                                </span>
                            )}
                        </div>
                        <CardTitle className="text-3xl md:text-4xl font-bold leading-tight">
                            {blogPost.title}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="prose prose-lg max-w-none px-6 py-8">
                        <div
                            dangerouslySetInnerHTML={{ __html: blogPost.content }}
                            className="prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-lg prose-strong:text-gray-900"
                        />
                    </CardContent>

                    <Separator className="my-2" />

                    <CardFooter className="flex flex-col space-y-6 bg-gray-50 p-6">
                        <div className="flex flex-wrap items-center justify-between w-full gap-4">
                            <LikeDislikeButtons
                                likeCount={blogPost.likeCount || 0}
                                dislikeCount={blogPost.dislikeCount || 0}
                                onLike={() => handleLikeDislike('like')}
                                onDislike={() => handleLikeDislike('dislike')}
                                userLiked={user?.id ? blogPost.likes?.[user.id] || false : false}
                                userDisliked={user?.id ? blogPost.dislikes?.[user.id] || false : false}
                            />
                            <div className="flex items-center space-x-2">
                                <MessageCircle className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-500">
                                    {blogPost.commentCount || 0} bình luận
                                </span>
                            </div>
                        </div>


                        {/* Related Tags Section */}
                        {blogPost.category && (
                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-gray-600">Chủ đề liên quan:</span>
                                <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                                    {blogPost.category}
                                </span>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="w-full space-y-4">
                            <h3 className="text-xl font-semibold">Bình luận</h3>
                            <CommentSection blogPostId={id} />
                        </div>
                    </CardFooter>
                </Card>

                {/* Related Posts Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Bài viết liên quan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {relatedPosts.length > 0 ? (
                            relatedPosts.map((post) => (
                                <Card key={post.id} className="overflow-hidden">
                                    <div className="relative w-full pt-[56.25%]">
                                        <Image
                                            src={post.imageUrl || '/placeholder.svg'}
                                            alt={post.title}
                                            layout="fill"
                                            objectFit="cover"
                                            className="transition-transform duration-300 hover:scale-105"
                                        />
                                    </div>
                                    <CardContent className="p-4">
                                        <CardTitle className="text-lg mb-2 line-clamp-2">{post.title}</CardTitle>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {post.author} - {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/pages/blogs/${post.id}`)}
                                            className="w-full"
                                        >
                                            Đọc thêm
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-3 text-center text-gray-500">
                                Không có bài viết liên quan.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

