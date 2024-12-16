import { CheckCircle, Clock, Package, Star, Truck, XCircle } from 'lucide-react'
import React from 'react'

interface OrderHistory {
  status: string
  timestamp: string
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
    case "shipped":
      return <Truck className="w-6 h-6" />
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
              <p className="text-sm text-gray-600 mb-1">Cập nhật bởi: {history.updatedBy}</p>
              {history.reason && <p className="text-sm text-gray-600">Lý do: {history.reason}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderStatusHistory
