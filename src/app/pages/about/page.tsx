import Image from 'next/image';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function About() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Về JNX Tennis Store</h1>

      <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
        <div>
          <h2 className="text-3xl font-semibold mb-4">Câu Chuyện Của Chúng Tôi</h2>
          <p className="text-lg mb-4">
            Được thành lập vào năm 2024, JNX Tennis Store được phát triển và xây dựng bởi Nguyễn Xuân Dũng
            với mục tiêu luôn đam mê mang đến những thiết bị tennis tốt nhất cho người chơi ở mọi cấp độ. Hành trình của chúng tôi bắt đầu với một ý tưởng đơn giản: cung cấp dụng cụ tennis chất lượng cao kèm theo dịch vụ khách hàng xuất sắc.
          </p>
          <p className="text-lg mb-4">
            Qua nhiều năm, chúng tôi đã phát triển từ một cửa hàng nhỏ địa phương thành một nhà bán lẻ trực tuyến đáng tin cậy, phục vụ những người yêu thích tennis trên khắp cả nước. Cam kết về chất lượng và sự hài lòng của khách hàng vẫn luôn là cốt lõi trong mọi hoạt động của chúng tôi.
          </p>
        </div>
        <div className="relative h-[400px] w-full max-w-[400px] mx-auto">
          <Image
            src="https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico"
            alt="JNX Tennis Store"
            layout="fill"
            objectFit="contain"
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-8 rounded-lg shadow-md mb-12">
        <h2 className="text-3xl font-semibold mb-4 text-center">Sứ Mệnh Của Chúng Tôi</h2>
        <p className="text-lg text-center">
          Trao đến cho người chơi tennis với thiết bị hàng đầu và lời khuyên chuyên gia, giúp họ thể hiện tốt nhất và tận hưởng trò chơi một cách trọn vẹn nhất.
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 text-center">Tại Sao Chọn JNX?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Sản Phẩm Chất Lượng", description: "Chúng tôi cung cấp từ các thương hiệu hàng đầu để đảm bảo bạn nhận được sản phẩm tốt nhất." },
            { title: "Tư Vấn Chuyên Nghiệp", description: "Đội ngũ chuyên gia tennis của chúng tôi luôn sẵn sàng hỗ trợ." },
            { title: "Giao Hàng Nhanh Chóng", description: "Nhận thiết bị của bạn nhanh chóng với dịch vụ giao hàng hiệu quả của chúng tôi." }
          ].map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-semibold mb-6">Sẵn Sàng Nâng Cao Trình Độ Của Bạn?</h2>
        <Link href="/pages/products">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full">
            Mua Sắm Ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}

