"use client"

import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons'
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { get, push, ref, serverTimestamp, update } from "firebase/database"
import { ArrowLeft, CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react'
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "react-hot-toast"

import OrderStatusHistory from "@/app/components/OrderStatusHistory"
import ProductReview from "@/app/components/ProductReview"
import { useAuthContext } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { database } from "@/firebaseConfig"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  productId: string
  reviewed?: boolean
}

interface Order {
  id: string
  userId: string
  fullName: string
  phoneNumber: string
  shippingAddress: {
    province: string
    district: string
    ward: string
    address: string
  }
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  total: number
  status: string
  paymentMethod: string
  createdAt: string
}

interface Review {
  rating: number
  comment: string
  createdAt: string
  userId: string
  orderId: string
}

interface OrderHistory {
  status: string
  timestamp: string
  updatedBy: string
  reason?: string
}

export default function OrderDetail() {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const [showBulkReviewDialog, setShowBulkReviewDialog] = useState(false)
  const [bulkRating, setBulkRating] = useState(0)
  const [bulkComment, setBulkComment] = useState("")
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([])
  const { user } = useAuthContext()
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const fetchOrder = useCallback(async () => {
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để xem chi tiết đơn hàng")
      setIsLoading(false)
      return
    }

    try {
      const orderRef = ref(database, `orders/${user.id}/${orderId}`)
      const snapshot = await get(orderRef)

      if (snapshot.exists()) {
        const orderData = snapshot.val()
        setOrder({ id: orderId, ...orderData })

        // Fetch order history
        const historyRef = ref(database, `orderStatusHistory/${orderId}`)
        const historySnapshot = await get(historyRef)
        if (historySnapshot.exists()) {
          const historyData = historySnapshot.val()
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          const historyArray = Object.entries(historyData).map(([, value]: [string, any]) => ({
            status: value.status,
            timestamp: value.timestamp,
            updatedBy: value.updatedBy,
            reason: value.reason
          }))
          setOrderHistory(historyArray.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()))
        }
      } else {
        toast.error("Không tìm thấy thông tin đơn hàng")
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết đơn hàng:", error)
      toast.error("Không thể tải thông tin đơn hàng")
    } finally {
      setIsLoading(false)
    }
  }, [user, orderId])

  const fetchReviews = useCallback(async () => {
    if (!order || !order.items || !Array.isArray(order.items)) return;

    const reviewPromises = order.items.map(async (item) => {
      const reviewRef = ref(database, `reviews/${item.productId}`)
      const snapshot = await get(reviewRef)
      if (snapshot.exists()) {
        const reviewsData = snapshot.val()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // eslint-disable-next-line
        const userReview = Object.values(reviewsData).find((review: any) => review.userId === user?.id && review.orderId === order.id)
        if (userReview) {
          return { [item.productId]: userReview as Review }
        }
      }
      return null
    })

    const reviewResults = await Promise.all(reviewPromises)
    const newReviews = reviewResults.reduce((acc, review) => {
      if (review) {
        return { ...acc, ...review }
      }
      return acc
    }, {} as Record<string, Review>)

    setReviews(newReviews || {})
  }, [order, user])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "pending": "Đã đặt hàng",
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "reviewed":
      case "completed":
        return "text-green-600"
      case "cancelled":
        return "text-red-600"
      default:
        return "text-yellow-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-5 h-5" />
      case "processing":
        return <Package className="w-5 h-5" />
      case "shipping":
      case "shipped":
        return <Truck className="w-5 h-5" />
      case "delivered":
      case "reviewed":
      case "completed":
        return <CheckCircle className="w-5 h-5" />
      case "cancelled":
        return <XCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cod":
        return "Thanh toán khi nhận hàng (COD)"
      case "vnpay":
        return "Thanh toán qua VNPAY"
      default:
        return method
    }
  }

  const createNotification = async (message: string) => {
    const notificationsRef = ref(database, 'notifications');
    await push(notificationsRef, {
      orderId: order?.id,
      message,
      createdAt: serverTimestamp(),
      seen: false
    });
  };

  const updateOrderStatusHistory = async (newStatus: string, reason?: string) => {
    const historyRef = ref(database, `orderStatusHistory/${orderId}/${Date.now()}`);
    await update(historyRef, {
      status: newStatus,
      timestamp: serverTimestamp(),
      updatedBy: user?.id || 'Khách hàng',
      reason: reason || ''
    });
  };

  const handleReviewSubmitted = async (productId: string) => {
    await fetchReviews();

    const updatedOrder = { ...order! };
    updatedOrder.items = updatedOrder.items.map(item =>
      item.productId === productId ? { ...item, reviewed: true } : item
    );

    const allReviewed = updatedOrder.items.every(item => item.reviewed);
    if (allReviewed) {
      updatedOrder.status = 'reviewed';
      const orderRef = ref(database, `orders/${user?.id}/${order?.id}`);
      await update(orderRef, { status: 'reviewed', items: updatedOrder.items });
      await createNotification(`Đơn hàng #${order?.id.slice(-6)} đã được khách hàng đánh giá đầy đủ`);
      await updateOrderStatusHistory('reviewed');
    } else {
      const orderRef = ref(database, `orders/${user?.id}/${order?.id}`);
      await update(orderRef, { items: updatedOrder.items });
    }

    setOrder(updatedOrder);
    await fetchOrder();

    if (allReviewed) {
      toast.success('Tất cả sản phẩm đã được đánh giá. Cảm ơn bạn!');
    }
  }

  const handleConfirmDelivery = async () => {
    if (!user?.id || !order) return;

    try {
      const orderRef = ref(database, `orders/${user.id}/${order.id}`);
      await update(orderRef, { status: 'delivered' });
      setOrder({ ...order, status: 'delivered' });
      toast.success('Đã xác nhận nhận hàng thành công');
      await createNotification(`Đơn hàng #${order.id.slice(-6)} đã được khách hàng xác nhận nhận hàng`);
      await updateOrderStatusHistory('delivered');
      await fetchOrder();
    } catch (error) {
      console.error('Lỗi khi xác nhận nhận hàng:', error);
      toast.error('Không thể xác nhận nhận hàng. Vui lòng thử lại sau.');
    }
  }

  const handleBulkReview = async () => {
    if (!order || !user) return;

    const unreviewed = order.items.filter(item => !reviews[item.productId]);
    for (const item of unreviewed) {
      const reviewRef = ref(database, `reviews/${item.productId}`);
      await push(reviewRef, {
        userId: user.id,
        rating: bulkRating,
        comment: bulkComment,
        createdAt: new Date().toISOString(),
        orderId: order.id
      });

      const productRef = ref(database, `products/${item.productId}`);
      const productSnapshot = await get(productRef);
      if (productSnapshot.exists()) {
        const productData = productSnapshot.val();
        const currentRating = productData.rating || 0;
        const currentReviewCount = productData.reviewCount || 0;
        const newReviewCount = currentReviewCount + 1;
        const newRating = ((currentRating * currentReviewCount) + bulkRating) / newReviewCount;
        await update(productRef, {
          rating: newRating,
          reviewCount: newReviewCount
        });
      }
    }

    const updatedItems = order.items.map(item => ({ ...item, reviewed: true }));
    const orderRef = ref(database, `orders/${user.id}/${order.id}`);
    await update(orderRef, {
      status: 'reviewed',
      items: updatedItems
    });

    setOrder({ ...order, status: 'reviewed', items: updatedItems });
    await fetchReviews();
    setShowBulkReviewDialog(false);

    await createNotification(`Đơn hàng #${order.id.slice(-6)} đã được khách hàng đánh giá đầy đủ`);
    await updateOrderStatusHistory('reviewed');
    await fetchOrder();

    toast.success('Đã đánh giá tất cả sản phẩm thành công!');
  }

  const openBulkReviewDialog = () => {
    setShowBulkReviewDialog(true);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Chi Tiết Đơn Hàng</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-lg">Không tìm thấy thông tin đơn hàng.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const unreviewedItems = order.items.filter(item => !reviews[item.productId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push('/pages/account/orders')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách đơn hàng
      </Button>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">Chi Tiết Đơn Hàng #{order.id.slice(-6)}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Thông Tin Đơn Hàng</span>
            <span className={`text-sm font-normal ${getStatusColor(order.status)} flex items-center`}>
              {getStatusIcon(order.status)}
              <span className="ml-2">{getStatusLabel(order.status)}</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Ngày đặt hàng:</strong> {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          <p><strong>Phương thức thanh toán:</strong> {getPaymentMethodLabel(order.paymentMethod)}</p>
          <p><strong>Tổng tiền:</strong> {order.total.toLocaleString("vi-VN")} ₫</p>
          <p><strong>Phí vận chuyển:</strong> {order.shippingFee.toLocaleString("vi-VN")} ₫</p>
          {order.status === 'shipped' && (
            <Button onClick={handleConfirmDelivery} className="mt-4">
              Xác nhận đã nhận hàng
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thông Tin Giao Hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Họ tên:</strong> {order.fullName}</p>
          <p><strong>Số điện thoại:</strong> {order.phoneNumber}</p>
          <p><strong>Địa chỉ:</strong> {`${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lịch Sử Trạng Thái Đơn Hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusHistory orderHistory={orderHistory} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Sản Phẩm Đã Mua</span>
            {(order.status === 'delivered' || order.status === 'reviewed') && unreviewedItems.length > 0 && (
              <Button onClick={openBulkReviewDialog}>
                Đánh giá tất cả sản phẩm
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-8">
            {order.items.map((item) => (
              <li key={item.id} className="border-b pb-6">
                <div className="flex items-center space-x-4">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="object-cover rounded-md"
                  />
                  <div className="flex-grow">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    <p className="text-sm text-gray-600">Đơn giá: {item.price.toLocaleString("vi-VN")} ₫</p>
                  </div>
                  <p className="font-semibold">{(item.price * item.quantity).toLocaleString("vi-VN")} ₫</p>
                </div>
                {(order.status === 'delivered' || order.status === 'reviewed') && (
                  <div className="mt-4">
                    {reviews[item.productId] ? (
                      <div className="bg-gray-100 p-4 rounded-md">
                        <p className="font-semibold">Đánh giá của bạn:</p>
                        <div className="flex items-center mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FontAwesomeIcon
                              key={star}
                              icon={star <= reviews[item.productId].rating ? faStarSolid : faStarRegular}
                              className={`text-2xl ${star <= reviews[item.productId].rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <p className="mt-2">{reviews[item.productId].comment}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Đánh giá vào: {new Date(reviews[item.productId].createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    ) : (
                      <ProductReview
                        productId={item.productId}
                        orderId={order.id}
                        onReviewSubmitted={() => handleReviewSubmitted(item.productId)}
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={showBulkReviewDialog} onOpenChange={setShowBulkReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá tất cả sản phẩm</DialogTitle>
            <DialogDescription>
              Đánh giá này sẽ áp dụng cho tất cả sản phẩm chưa được đánh giá trong đơn hàng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setBulkRating(star)}
                    className={`text-2xl ${bulkRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <FontAwesomeIcon icon={bulkRating >= star ? faStarSolid : faStarRegular} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="bulkComment" className="block text-sm font-medium text-gray-700 mb-1">
                Nhận xét
              </label>
              <Textarea
                id="bulkComment"
                value={bulkComment}
                onChange={(e) => setBulkComment(e.target.value)}
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                rows={4}
                placeholder="Chia sẻ trải nghiệm của bạn về các sản phẩm này"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setShowBulkReviewDialog(false)}>Hủy</Button>
              <Button onClick={handleBulkReview}>Đánh giá tất cả</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

