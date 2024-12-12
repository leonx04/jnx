import { AlertCircle } from 'lucide-react';

const NoResultsFound = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Không tìm thấy sản phẩm</h2>
      <p className="text-gray-600">
        Xin lỗi, chúng tôi không tìm thấy sản phẩm nào phù hợp với tiêu chí tìm kiếm của bạn.
        Vui lòng thử lại với các bộ lọc khác.
      </p>
    </div>
  );
};

export default NoResultsFound;

