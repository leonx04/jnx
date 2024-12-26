import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface LikeDislikeButtonsProps {
    likeCount: number
    dislikeCount: number
    onLike: () => void
    onDislike: () => void
}

export function LikeDislikeButtons({ likeCount, dislikeCount, onLike, onDislike }: LikeDislikeButtonsProps) {
    return (
        <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onLike} className="flex items-center space-x-2">
                <ThumbsUp className="h-4 w-4" />
                <span>{likeCount || 0}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onDislike} className="flex items-center space-x-2">
                <ThumbsDown className="h-4 w-4" />
                <span>{dislikeCount || 0}</span>
            </Button>
        </div>
    )
}

