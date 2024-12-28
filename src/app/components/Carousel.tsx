'use client';

// Import các icon từ FontAwesome
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Import các module cần thiết từ Next.js và React
import Image from 'next/image';
import { useEffect, useState } from 'react';

// Định nghĩa interface cho từng slide
interface Slide {
  image: string; // URL hình ảnh
  title: string; // Tiêu đề slide
  description: string; // Mô tả slide
}

// Định nghĩa interface cho component Carousel
interface CarouselProps {
  slides: Slide[]; // Danh sách các slide
}

// Component Carousel
const Carousel: React.FC<CarouselProps> = ({ slides }) => {
  const [activeSlide, setActiveSlide] = useState(0); // Trạng thái slide hiện tại

  // Tự động chuyển slide sau mỗi 5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prevSlide) => (prevSlide + 1) % slides.length); // Chuyển sang slide kế tiếp
    }, 5000);
    return () => clearInterval(timer); // Dọn dẹp timer khi component bị unmount
  }, [slides.length]);

  // Hàm chuyển sang slide kế tiếp
  const goToNextSlide = () => {
    setActiveSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  // Hàm quay lại slide trước đó
  const goToPrevSlide = () => {
    setActiveSlide((prevSlide) => (prevSlide - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden">
      {/* Hiển thị từng slide */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${index === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
        >
          {/* Hình ảnh của slide */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Thông tin tiêu đề và mô tả */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{slide.title}</h2>
            <p className="text-sm sm:text-base">{slide.description}</p>
          </div>
        </div>
      ))}

      {/* Nút quay lại slide trước */}
      <button
        onClick={goToPrevSlide}
        className="absolute top-1/2 left-2 sm:left-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full transition-all duration-300 hover:bg-opacity-75 hover:scale-110"
        aria-label="Previous slide"
      >
        <FontAwesomeIcon icon={faChevronLeft} size="lg" />
      </button>

      {/* Nút chuyển sang slide tiếp theo */}
      <button
        onClick={goToNextSlide}
        className="absolute top-1/2 right-2 sm:right-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full transition-all duration-300 hover:bg-opacity-75 hover:scale-110"
        aria-label="Next slide"
      >
        <FontAwesomeIcon icon={faChevronRight} size="lg" />
      </button>
    </div>
  );
};

export default Carousel;
