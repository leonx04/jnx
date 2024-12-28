'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

// Component Footer
const Footer = () => {
  const [isLoading, setIsLoading] = useState(false); // Trạng thái để kiểm tra đang gửi hay không

  // Hàm xử lý khi người dùng gửi form
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Ngừng hành động mặc định khi gửi form
    setIsLoading(true); // Đánh dấu trạng thái gửi form

    const formData = new FormData(event.currentTarget); // Lấy dữ liệu từ form
    const email = formData.get('email-address'); // Lấy giá trị email từ form

    try {
      // Gửi yêu cầu tới Google Apps Script (thay thế URL với URL thật của bạn)
      const response = await fetch('https://script.google.com/macros/s/AKfycbzHIZgIWPfV5jlUkrSk0Ng3gSMUPVGIyvUQRrCq0fnFba8RTPZk7TBs4MEko6I5XrY/exec', {
        method: 'POST', // Phương thức POST
        body: JSON.stringify({ email }), // Gửi email dưới dạng JSON
        headers: {
          'Content-Type': 'application/json', // Định dạng dữ liệu là JSON
        },
      });

      if (response.ok) {
        toast.success('Đăng ký nhận bản tin thành công!'); // Thông báo thành công
        (event.target as HTMLFormElement).reset(); // Reset form sau khi gửi
      } else {
        throw new Error('Có lỗi xảy ra'); // Nếu có lỗi, ném lỗi
      }
    } catch (error) {
      toast.error('Không thể gửi thông tin. Vui lòng thử lại sau.'); // Thông báo lỗi
    } finally {
      setIsLoading(false); // Đánh dấu kết thúc quá trình gửi form
    }
  };

  return (
    <footer className="bg-black text-white">
      {/* Container chính của footer */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
            {/* Phần sản phẩm */}
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Sản phẩm</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">Vợt tennis</Link></li>
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">Bóng tennis</Link></li>
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">Phụ kiện</Link></li>
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">Quần áo tennis</Link></li>
                </ul>
              </div>
              {/* Phần hỗ trợ */}
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Hỗ trợ</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">Hướng dẫn chọn vợt</Link></li>
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">Bảo hành</Link></li>
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">Đổi trả</Link></li>
                  <li><Link href="#" className="text-base text-gray-300 hover:text-white">FAQ</Link></li>
                </ul>
              </div>
            </div>
          </div>
          {/* Phần đăng ký nhận bản tin */}
          <div className="mt-8 xl:mt-0">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Đăng ký nhận bản tin
            </h3>
            <p className="mt-4 text-base text-gray-300">
              Nhận thông tin về sản phẩm mới, khuyến mãi và mẹo chơi tennis hàng tuần.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 sm:flex sm:max-w-md">
              <label htmlFor="email-address" className="sr-only">Địa chỉ email</label>
              <input
                type="email"
                name="email-address"
                id="email-address"
                autoComplete="email"
                required
                className="appearance-none min-w-0 w-full bg-white border border-transparent rounded-md py-2 px-4 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white focus:border-white focus:placeholder-gray-400"
                placeholder="Nhập email của bạn"
              />
              <div className="mt-3 rounded-md sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                <button
                  type="submit"
                  className="w-full bg-white text-black font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-200 flex items-center justify-center"
                  disabled={isLoading} // Vô hiệu hóa nút khi đang gửi
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : null}
                  {isLoading ? 'Đang gửi...' : 'Đăng ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
