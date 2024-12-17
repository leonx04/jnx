import { faStar, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { database } from '../../firebaseConfig';
import { onValue, ref } from 'firebase/database';

interface Review {
  comment: string;
  rating: number;
  userName: string;
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const reviewsRef = ref(database, 'reviews');
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reviewsArray = Object.values(data)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          .flatMap((productReviews: any) => Object.values(productReviews))
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          .filter((review: any) => review.comment && review.comment.length > 0)
          .slice(0, 3);
        setReviews(reviewsArray as Review[]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="my-16">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-8 text-center">Đánh giá từ khách hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <FontAwesomeIcon icon={faQuoteLeft} className="text-3xl text-gray-300 mb-4" />
              <p className="text-gray-600 mb-4">{review.comment}</p>
              <div className="flex items-center">
                <div className="flex mr-2">
                  {[...Array(5)].map((_, i) => (
                    <FontAwesomeIcon
                      key={i}
                      icon={faStar}
                      className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="font-semibold">{review.userName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

