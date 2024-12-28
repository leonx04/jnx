import { faStar, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';  // Import các icon từ FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';  // Import FontAwesomeIcon component
import { useEffect, useState } from 'react';  // useEffect và useState để quản lý trạng thái và hiệu ứng phụ
import { database } from '../../firebaseConfig';  // Kết nối với Firebase
import { onValue, ref } from 'firebase/database';  // Các phương thức Firebase để làm việc với cơ sở dữ liệu

// Định nghĩa kiểu dữ liệu của đánh giá khách hàng
interface Review {
  comment: string;  // Nội dung bình luận
  rating: number;   // Đánh giá sao (1-5)
  userName: string; // Tên người dùng đã để lại bình luận
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);  // Lưu trữ danh sách đánh giá

  useEffect(() => {
    // Lấy tham chiếu đến bảng reviews trong Firebase
    const reviewsRef = ref(database, 'reviews');

    // Lắng nghe sự thay đổi dữ liệu từ Firebase
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();  // Lấy dữ liệu từ Firebase
      if (data) {
        // Chuyển đổi dữ liệu từ Firebase thành mảng các đánh giá
        const reviewsArray = Object.values(data)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          .flatMap((productReviews: any) => Object.values(productReviews))  // Lấy tất cả đánh giá của các sản phẩm
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          .filter((review: any) => review.comment && review.comment.length > 0)  // Lọc ra các đánh giá có nội dung
          .slice(0, 3);  // Lấy 3 đánh giá đầu tiên
        setReviews(reviewsArray as Review[]);  // Cập nhật danh sách đánh giá vào state
      }
    });

    return () => unsubscribe();  // Dọn dẹp khi component bị hủy
  }, []);  // Hook chỉ chạy 1 lần khi component mount

  return (
    <section className="my-16">  {/* Phần hiển thị đánh giá khách hàng */}
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-8 text-center">Đánh giá từ khách hàng</h2>  {/* Tiêu đề phần đánh giá */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">  {/* Lưới hiển thị các đánh giá */}
          {reviews.map((review, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">  {/* Thẻ div cho từng đánh giá */}
              <FontAwesomeIcon icon={faQuoteLeft} className="text-3xl text-gray-300 mb-4" />  {/* Biểu tượng dấu ngoặc kép */}
              <p className="text-gray-600 mb-4">{review.comment}</p>  {/* Nội dung bình luận */}

              <div className="flex items-center">  {/* Thông tin sao và tên người dùng */}
                <div className="flex mr-2">
                  {[...Array(5)].map((_, i) => (
                    // Vẽ 5 sao, đánh dấu sao nào được chấm
                    <FontAwesomeIcon
                      key={i}
                      icon={faStar}
                      className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}  // Đánh dấu sao vàng nếu được chấm
                    />
                  ))}
                </div>
                <span className="font-semibold">{review.userName}</span>  {/* Hiển thị tên người dùng */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
