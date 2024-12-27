import { CheckCircle, Clock, Package, Star, Truck, XCircle, Container } from 'lucide-react'
import React from 'react'

interface OrderHistory {
  status: string
  timestamp: string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line
  updatedBy: string
  reason?: string
}

interface OrderStatusHistoryProps {
  orderHistory: OrderHistory[]
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock className="w-6 h-6" />
    case "processing":
      return <Package className="w-6 h-6" />
    case "shipping":
      return <Truck className="w-6 h-6" />
    case "shipped":
      return <Container className="w-6 h-6" />
    case "delivered":
      return <CheckCircle className="w-6 h-6" />
    case "reviewed":
      return <Star className="w-6 h-6" />
    case "completed":
      return <CheckCircle className="w-6 h-6" />
    case "cancelled":
      return <XCircle className="w-6 h-6" />
    default:
      return null
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
    case "reviewed":
    case "completed":
      return "text-green-600 bg-green-100"
    case "cancelled":
      return "text-red-600 bg-red-100"
    case "shipping":
    case "shipped":
      return "text-blue-600 bg-blue-100"
    default:
      return "text-yellow-600 bg-yellow-100"
  }
}

const getStatusLabel = (status: string) => {
  const statusMap: { [key: string]: string } = {
    "pending": "Chờ xử lý",
    "processing": "Đang chuẩn bị",
    "shipping": "Đang giao hàng",
    "shipped": "Đã giao hàng",
    "delivered": "Đã nhận hàng",
    "reviewed": "Đã đánh giá",
    "completed": "Đã hoàn thành",
    "cancelled": "Đã hủy"
  }
  return statusMap[status.toLowerCase()] || status
}

const getCancellationReasonLabel = (reason: string) => {
  const reasonMap: { [key: string]: string } = {
    "changed_mind": "Tôi đổi ý, không muốn mua nữa",
    "found_better_deal": "Tìm thấy sản phẩm tốt hơn ở nơi khác",
    "financial_reasons": "Lý do tài chính",
    "other": "Lý do khác"
  }
  return reasonMap[reason] || reason
}

const OrderStatusHistory: React.FC<OrderStatusHistoryProps> = ({ orderHistory }) => {
  return (
    <div className="relative">
      {orderHistory.map((history, index) => (
        <div key={index} className="flex mb-8 last:mb-0">
          <div className="flex flex-col items-center mr-4">
            <div className={`rounded-full p-2 ${getStatusColor(history.status)}`}>
              {getStatusIcon(history.status)}
            </div>
            {index < orderHistory.length - 1 && (
              <div className="w-0.5 bg-gray-300 h-full mt-2" />
            )}
          </div>
          <div className="flex-grow">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-1">{getStatusLabel(history.status)}</h3>
              <p className="text-sm text-gray-600 mb-1">{new Date(history.timestamp).toLocaleString("vi-VN")}</p>
              {history.status.toLowerCase() === 'cancelled' && history.reason && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold">Lý do hủy đơn:</span> {getCancellationReasonLabel(history.reason)}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderStatusHistory

