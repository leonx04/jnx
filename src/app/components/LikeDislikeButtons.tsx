import { Button } from "@/components/ui/button"; // Import component Button từ thư viện UI của bạn
import { ThumbsDown, ThumbsUp } from 'lucide-react'; // Import biểu tượng "ThumbsUp" và "ThumbsDown" từ thư viện lucide-react

// Định nghĩa kiểu dữ liệu cho props của component
interface LikeDislikeButtonsProps {
    likeCount?: number; // Số lượng like (tùy chọn)
    dislikeCount?: number; // Số lượng dislike (tùy chọn)
    onLike: () => void; // Hàm khi người dùng nhấn like
    onDislike: () => void; // Hàm khi người dùng nhấn dislike
    userLiked: boolean; // Trạng thái người dùng đã like chưa
    userDisliked: boolean; // Trạng thái người dùng đã dislike chưa
}

// Component LikeDislikeButtons
export function LikeDislikeButtons({
    likeCount,
    dislikeCount,
    onLike,
    onDislike,
    userLiked,
    userDisliked
}: LikeDislikeButtonsProps) {
    return (
        <div className="flex items-center space-x-4">
            {/* Nút like */}
            <Button
                variant={userLiked ? "default" : "outline"} // Đổi kiểu nút tùy thuộc vào người dùng đã like chưa
                size="sm" // Kích thước nút nhỏ
                onClick={onLike} // Khi nhấn nút like, gọi hàm onLike
                className="flex items-center space-x-2" // Các class để tạo kiểu cho nút
            >
                <ThumbsUp className="h-4 w-4" /> {/* Biểu tượng thumbs up */}
                <span>{likeCount ?? 0}</span> {/* Hiển thị số lượng like, nếu không có thì hiển thị 0 */}
            </Button>

            {/* Nút dislike */}
            <Button
                variant={userDisliked ? "default" : "outline"} // Đổi kiểu nút tùy thuộc vào người dùng đã dislike chưa
                size="sm" // Kích thước nút nhỏ
                onClick={onDislike} // Khi nhấn nút dislike, gọi hàm onDislike
                className="flex items-center space-x-2" // Các class để tạo kiểu cho nút
            >
                <ThumbsDown className="h-4 w-4" /> {/* Biểu tượng thumbs down */}
                <span>{dislikeCount ?? 0}</span> {/* Hiển thị số lượng dislike, nếu không có thì hiển thị 0 */}
            </Button>
        </div>
    );
}
