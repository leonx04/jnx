"use client"

import { SavedAddressCard } from "@/app/components/SavedAddressCard"
import { useAuthContext } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { database } from "@/firebaseConfig"
import { get, onValue, push, ref, set } from "firebase/database"
import { Check, Loader2, Search } from 'lucide-react'
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"

// Interfaces
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  productId: string
  weight: number
  length: number
  width: number
  height: number
}

interface Province {
  ProvinceID: number
  ProvinceName: string
}

interface District {
  DistrictID: number
  DistrictName: string
}

interface Ward {
  WardCode: string
  WardName: string
}

interface PaymentMethod {
  id: string
  name: string
  description: string
}

interface SavedAddress {
  fullName: string
  phoneNumber: string
  province: string
  district: string
  ward: string
  address: string
}

interface Voucher {
  id: string
  voucherCode: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  startDate: string
  endDate: string
  minOrderValue: number
  maxDiscountAmount: number
  usageLimit: number
  usedCount: number
  quantity: number
  status: 'active' | 'inactive' | 'expired' | 'incoming'
  isExclusive: boolean
  userId?: string[]
}

function CheckoutContent() {
  // State declarations
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedWard, setSelectedWard] = useState("")
  const [address, setAddress] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [shippingFee, setShippingFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<string>("cod")
  const [paymentMethods] = useState<PaymentMethod[]>([
    { id: "cod", name: "Thanh toán khi nhận hàng (COD)", description: "Thanh toán bằng tiền mặt khi nhận hàng" },
    { id: "online", name: "Thanh toán qua online", description: "Thanh toán trực tuyến bằng ví điện tử online" },
  ])
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [voucherCode, setVoucherCode] = useState("")
  const [voucherSearchQuery, setVoucherSearchQuery] = useState("")
  const { user } = useAuthContext()
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = process.env.NEXT_PUBLIC_GHN_TOKEN || ""
  const shopId = parseInt(process.env.NEXT_PUBLIC_GHN_SHOP_ID || "0", 10)
  const serviceId = parseInt(process.env.NEXT_PUBLIC_GHN_SERVICE_ID || "0", 10)

  // Utility functions
  const calculateSubtotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [cartItems])

  const calculateDiscount = useCallback((voucher: Voucher | null) => {
    if (!voucher) return 0
    const subtotal = calculateSubtotal()
    if (subtotal < voucher.minOrderValue) return 0
    const discount = voucher.discountType === 'percentage'
      ? subtotal * (voucher.discountValue / 100)
      : voucher.discountValue
    return Math.min(discount, voucher.maxDiscountAmount)
  }, [calculateSubtotal])

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount(selectedVoucher)
    const total = subtotal - discount + (subtotal > 2000000 ? 0 : shippingFee)
    return Math.max(total, 0)
  }, [calculateSubtotal, calculateDiscount, selectedVoucher, shippingFee])

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    toast[type](message, {
      duration: 5000,
      position: 'top-right',
    })
  }, [])

  const validateForm = () => {
    const errors: string[] = []

    if (!fullName.trim()) errors.push("Vui lòng nhập đầy đủ họ và tên")
    if (!phoneNumber.trim()) {
      errors.push("Vui lòng nhập số điện thoại")
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phoneNumber)) {
      errors.push("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam")
    }
    if (!selectedProvince) errors.push("Vui lòng chọn Tỉnh/Thành phố")
    if (!selectedDistrict) errors.push("Vui lòng chọn Quận/Huyện")
    if (!selectedWard) errors.push("Vui lòng chọn Phường/Xã")
    if (!address.trim()) errors.push("Vui lòng nhập địa chỉ chi tiết")
    if (cartItems.length === 0) errors.push("Giỏ hàng của bạn đang trống")

    if (errors.length > 0) {
      errors.forEach(error => showToast(error, 'error'))
      return false
    }

    return true
  }

  const getUserDetails = useMemo(() => {
    if (!user) return null
    return {
      userId: user.id,
      userName: user.name || "",
      userEmail: user.email
    }
  }, [user])

  // Effect hooks
  useEffect(() => {
    const selectedProducts = localStorage.getItem("selectedProducts")
    if (selectedProducts) {
      setCartItems(JSON.parse(selectedProducts))
    } else if (user?.id) {
      const unsubscribe = onValue(ref(database, `carts/${user.id}`), (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const items = Object.entries(data).map(([id, item]) => ({
            id,
            ...(item as object),
          })) as CartItem[]
          setCartItems(items)
        } else {
          setCartItems([])
        }
      })

      return () => unsubscribe()
    }
  }, [user])

  useEffect(() => {
    fetch("https://online-gateway.ghn.vn/shiip/public-api/master-data/province", {
      headers: { "Token": token }
    })
      .then(response => response.json())
      .then(data => setProvinces(data.data))
      .catch(error => {
        console.error("Lỗi tải danh sách tỉnh:", error)
        showToast("Không thể tải danh sách tỉnh", 'error')
      })
  }, [showToast, token])

  const fetchDistricts = useCallback(async (provinceId: string) => {
    try {
      const response = await fetch(`https://online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=${provinceId}`, {
        headers: { "Token": token }
      });
      const data = await response.json();
      setDistricts(data.data);
    } catch (error) {
      console.error("Lỗi tải danh sách quận/huyện:", error);
      showToast("Không thể tải danh sách quận/huyện", 'error');
    }
  }, [showToast, token]);

  const fetchWards = useCallback(async (districtId: string) => {
    try {
      const response = await fetch(`https://online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${districtId}`, {
        headers: { "Token": token }
      });
      const data = await response.json();
      setWards(data.data);
    } catch (error) {
      console.error("Lỗi tải danh sách phường/xã:", error);
      showToast("Không thể tải danh sách phường/xã", 'error');
    }
  }, [showToast, token]);

  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince);
    } else {
      setDistricts([]);
      setSelectedDistrict("");
      setSelectedWard("");
    }
  }, [selectedProvince, fetchDistricts]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchWards(selectedDistrict);
    } else {
      setWards([]);
      setSelectedWard("");
    }
  }, [selectedDistrict, fetchWards]);

  const calculateShippingFee = useCallback(async () => {
    if (!selectedDistrict || !selectedWard) return

    const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0)
    const maxDimensions = cartItems.reduce((max, item) => ({
      length: Math.max(max.length, item.length || 0),
      width: Math.max(max.width, item.width || 0),
      height: Math.max(max.height, item.height || 0),
    }), { length: 0, width: 0, height: 0 })

    try {
      const response = await fetch("https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee", {
        method: "POST",
        headers: {
          "Token": token,
          "ShopId": shopId.toString(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "service_id": serviceId,
          "insurance_value": Math.round(calculateSubtotal()),
          "coupon": null,
          "from_district_id": 1542,
          "to_district_id": parseInt(selectedDistrict),
          "to_ward_code": selectedWard,
          "height": Math.max(1, Math.round(maxDimensions.height)),
          "length": Math.max(1, Math.round(maxDimensions.length)),
          "weight": Math.max(1, Math.round(totalWeight)),
          "width": Math.max(1, Math.round(maxDimensions.width))
        })
      })

      const data = await response.json()

      if (data.code === 200 && data.data && typeof data.data.total === "number") {
        setShippingFee(data.data.total)
      } else {
        console.error("Invalid response from shipping API:", data)
        setShippingFee(0)
      }
    } catch (error) {
      console.error("Error calculating shipping fee:", error)
      setShippingFee(0)
    }
  }, [selectedDistrict, selectedWard, cartItems, token, shopId, serviceId, calculateSubtotal])

  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard) {
      calculateShippingFee()
    }
  }, [selectedProvince, selectedDistrict, selectedWard, calculateShippingFee])

  // New function to create a notification
  const createNotification = async (orderId: string, message: string) => {
    const notificationsRef = ref(database, 'notifications');
    const newNotificationRef = push(notificationsRef);
    const newNotification = {
      orderId,
      message,
      createdAt: new Date().toISOString(),
      seen: false,
    };
    await set(newNotificationRef, newNotification);
  };

  // Function to update product quantities
  const updateProductQuantities = async () => {
    for (const item of cartItems) {
      const productRef = ref(database, `products/${item.productId}`);
      const productSnapshot = await get(productRef);
      const productData = productSnapshot.val();
      if (productData) {
        const newQuantity = productData.quantity - item.quantity;
        await set(productRef, { ...productData, quantity: newQuantity });
      }
    }
  };

  // Updated handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!validateForm()) {
      setIsSubmitting(false);
      return
    }

    if (!user?.id) {
      showToast("Vui lòng đăng nhập để hoàn tất đơn hàng.", 'error')
      setIsSubmitting(false);
      return
    }

    try {
      if (selectedVoucher) {
        const voucherRef = ref(database, `vouchers/${selectedVoucher.id}`)
        const voucherSnapshot = await get(voucherRef)
        const currentVoucher = voucherSnapshot.val() as Voucher

        if (!currentVoucher || currentVoucher.quantity <= 0 || currentVoucher.status !== 'active') {
          showToast("Voucher không còn hiệu lực hoặc đã hết lượt sử dụng", 'error')
          setSelectedVoucher(null)
          setIsSubmitting(false)
          return
        }

        const userVoucherUsageRef = ref(database, `userVoucherUsage/${user.id}/${selectedVoucher.id}`)
        const userVoucherUsageSnapshot = await get(userVoucherUsageRef)
        const userUsageCount = userVoucherUsageSnapshot.val() || 0

        if (userUsageCount >= currentVoucher.usageLimit) {
          showToast("Bạn đã đạt giới hạn sử dụng voucher này", 'error')
          setSelectedVoucher(null)
          setIsSubmitting(false)
          return
        }

        await set(voucherRef, {
          ...currentVoucher,
          quantity: currentVoucher.quantity - 1,
          usedCount: currentVoucher.usedCount + 1,
          status: currentVoucher.quantity === 1 ? 'expired' : currentVoucher.status
        })

        await set(userVoucherUsageRef, userUsageCount + 1)
      }

      const order = {
        ...getUserDetails,
        fullName,
        phoneNumber,
        items: cartItems,
        shippingAddress: {
          province: provinces.find(p => p.ProvinceID.toString() === selectedProvince)?.ProvinceName ?? "",
          district: districts.find(d => d.DistrictID.toString() === selectedDistrict)?.DistrictName ?? "",
          ward: wards.find(w => w.WardCode === selectedWard)?.WardName ?? "",
          address: address
        },
        subtotal: calculateSubtotal(),
        shippingFee: calculateSubtotal() > 2000000 ? 0 : shippingFee,
        discount: calculateDiscount(selectedVoucher),
        total: calculateTotal(),
        status: "pending",
        paymentMethod: paymentMethod,
        createdAt: new Date().toISOString(),
        voucher: selectedVoucher ? {
          id: selectedVoucher.id,
          code: selectedVoucher.voucherCode,
          discountValue: selectedVoucher.discountValue,
          discountType: selectedVoucher.discountType
        } : null
      }

      const orderValidationErrors: string[] = []
      if (!order.userId) orderValidationErrors.push("Thiếu thông tin người dùng")
      if (!order.userEmail) orderValidationErrors.push("Thiếu email")
      if (!order.fullName) orderValidationErrors.push("Thiếu tên")
      if (!order.phoneNumber) orderValidationErrors.push("Thiếu số điện thoại")
      if (order.items.length === 0) orderValidationErrors.push("Giỏ hàng trống")

      if (orderValidationErrors.length > 0) {
        orderValidationErrors.forEach(error => showToast(error, 'error'))
        setIsSubmitting(false);
        return
      }

      if (paymentMethod === "online") {
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: calculateTotal(),
            orderInfo: `Thanh toan don hang #${Date.now()}`,
            orderId: Date.now().toString(),
            userId: user.id,
            order: order,
          }),
        });

        const data = await response.json();

        if (data.paymentUrl) {
          await updateProductQuantities();
          localStorage.setItem('pendingOrder', JSON.stringify(order));
          window.location.href = data.paymentUrl;
        } else {
          throw new Error('Không thể tạo URL thanh toán');
        }
      } else {
        const orderRef = ref(database, `orders/${user.id}/${Date.now()}`)
        await set(orderRef, order)
        const orderId = orderRef.key as string;
        await createNotification(orderId, `Đơn hàng mới #${orderId.slice(-6)} từ ${order.fullName}`);

        await updateProductQuantities();

        const cartRef = ref(database, `carts/${user.id}`);
        await set(cartRef, null);
        showToast("Đặt hàng thành công!", 'success')
        localStorage.removeItem("selectedProducts")
        setCartItems([])

        setTimeout(() => {
          router.push("/pages/order-confirmation")
        }, 2000);
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error)
      showToast("Đã có lỗi xảy ra. Vui lòng thử lại.", 'error')
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (user?.id) {
      const ordersRef = ref(database, `orders/${user.id}`)
      get(ordersRef).then((snapshot) => {
        if (snapshot.exists()) {
          const orders = snapshot.val()
          const addresses: SavedAddress[] = Object.values(orders)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            // eslint-disable-next-line
            .map((order: any) => ({
              fullName: order.fullName,
              phoneNumber: order.phoneNumber,
              province: order.shippingAddress.province,
              district: order.shippingAddress.district,
              ward: order.shippingAddress.ward,
              address: order.shippingAddress.address
            }))
            .filter((address, index, self) =>
              index === self.findIndex((t) => (
                t.fullName === address.fullName &&
                t.phoneNumber === address.phoneNumber &&
                t.province === address.province &&
                t.district === address.district &&
                t.ward === address.ward &&
                t.address === address.address
              ))
            )
          setSavedAddresses(addresses)
        }
      })
    }
  }, [user])

  const handleSavedAddressSelect = useCallback((index: number) => {
    if (index >= 0 && index < savedAddresses.length) {
      const selectedAddress = savedAddresses[index];
      setFullName(selectedAddress.fullName);
      setPhoneNumber(selectedAddress.phoneNumber);
      setAddress(selectedAddress.address);

      const province = provinces.find(p => p.ProvinceName === selectedAddress.province);
      if (province) {
        setSelectedProvince(province.ProvinceID.toString());
        fetchDistricts(province.ProvinceID.toString()).then(() => {
          const district = districts.find(d => d.DistrictName === selectedAddress.district);
          if (district) {
            setSelectedDistrict(district.DistrictID.toString());
            fetchWards(district.DistrictID.toString()).then(() => {
              const ward = wards.find(w => w.WardName === selectedAddress.ward);
              if (ward) {
                setSelectedWard(ward.WardCode);
              }
            });
          }
        });
      }

      setSelectedSavedAddress(index.toString());
    }
  }, [savedAddresses, provinces, districts, wards, fetchDistricts, fetchWards]);

  const findBestVoucher = useCallback((vouchers: Voucher[]): Voucher | null => {
    const subtotal = calculateSubtotal();
    let bestVoucher: Voucher | null = null;
    let maxDiscount = 0;

    vouchers.forEach(voucher => {
      if (voucher.status === 'active' && subtotal >= voucher.minOrderValue && voucher.quantity > 0) {
        const discount = calculateDiscount(voucher);
        if (discount > maxDiscount) {
          maxDiscount = discount;
          bestVoucher = voucher;
        }
      }
    });

    return bestVoucher;
  }, [calculateSubtotal, calculateDiscount]);

  useEffect(() => {
    const fetchVouchers = async () => {
      if (user?.id) {
        const vouchersRef = ref(database, 'vouchers')
        const snapshot = await get(vouchersRef)
        if (snapshot.exists()) {
          const vouchersData = snapshot.val()
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          const allVouchers = Object.entries(vouchersData).map(([id, voucher]: [string, any]) => ({
            ...voucher,
            id
          }))
          const now = new Date()
          const userVouchers = allVouchers.filter(voucher =>
            (voucher.isExclusive && voucher.userId && voucher.userId.includes(user.id)) ||
            (!voucher.isExclusive && (voucher.status === 'active'))
          ).filter(voucher =>
            voucher.status === 'active' &&
            new Date(voucher.startDate) <= now &&
            new Date(voucher.endDate) >= now &&
            voucher.quantity > 0 &&
            (voucher.usageLimit - voucher.usedCount) > 0
          )
          setVouchers(userVouchers)

          const bestVoucher = findBestVoucher(userVouchers);
          if (bestVoucher) {
            setSelectedVoucher(bestVoucher);
            setVoucherCode(bestVoucher.voucherCode);
            showToast(`Đã tự động áp dụng voucher ${bestVoucher.voucherCode} để tiết kiệm tối đa`, 'success');
          }
        }
      }
    }
    fetchVouchers()
  }, [user, findBestVoucher, showToast])

  const handleVoucherSelect = async (voucher: Voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);

    if (now < startDate || now > endDate) {
      showToast("Voucher này không trong thời gian sử dụng", 'error');
      return;
    }

    if (voucher.status !== 'active') {
      showToast("Voucher này không thể sử dụng", 'error');
      return;
    }

    if (calculateSubtotal() < voucher.minOrderValue) {
      showToast(`Đơn hàng chưa đạt giá trị tối thiểu ${formatCurrency(voucher.minOrderValue)} để sử dụng voucher này`, 'error');
      return;
    }

    const voucherRef = ref(database, `vouchers/${voucher.id}`);
    const voucherSnapshot = await get(voucherRef);
    const currentVoucher = voucherSnapshot.val() as Voucher;

    if (!currentVoucher || currentVoucher.quantity <= 0 || (currentVoucher.usageLimit - currentVoucher.usedCount) <= 0) {
      showToast("Voucher đã hết lượt sử dụng", 'error');
      return;
    }

    if (user?.id) {
      const userVoucherUsageRef = ref(database, `userVoucherUsage/${user.id}/${voucher.id}`);
      const userVoucherUsageSnapshot = await get(userVoucherUsageRef);
      const userUsageCount = userVoucherUsageSnapshot.val() || 0;

      if (userUsageCount >= currentVoucher.usageLimit) {
        showToast("Bạn đã đạt giới hạn sử dụng voucher này", 'error');
        return;
      }
    } else {
      showToast("Vui lòng đăng nhập để sử dụng voucher", 'error');
      return;
    }

    setSelectedVoucher(currentVoucher);
    setVoucherCode(currentVoucher.voucherCode);
    showToast(`Đã áp dụng voucher ${currentVoucher.voucherCode}`, 'success');
  };

  const handleVoucherCodeSubmit = () => {
    const voucher = vouchers.find(v => v.voucherCode === voucherCode)
    if (voucher) {
      handleVoucherSelect(voucher)
    } else {
      showToast("Mã voucher không hợp lệ", 'error')
    }
  }

  const filteredVouchers = useMemo(() => {
    const now = new Date();
    return vouchers.filter(voucher => {
      const startDate = new Date(voucher.startDate);
      const endDate = new Date(voucher.endDate);
      return (
        (voucher.voucherCode.toLowerCase().includes(voucherSearchQuery.toLowerCase()) ||
          voucher.description.toLowerCase().includes(voucherSearchQuery.toLowerCase())) &&
        startDate <= now &&
        endDate > now
      );
    });
  }, [vouchers, voucherSearchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getVoucherStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động'
      case 'inactive':
        return 'Không hoạt động'
      case 'expired':
        return 'Đã hết hạn'
      case 'incoming':
        return 'Sắp diễn ra'
      default:
        return status
    }
  }

  // Handle VNPay response
  useEffect(() => {
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode')
    const vnp_TxnRef = searchParams.get('vnp_TxnRef')

    if (vnp_ResponseCode && vnp_TxnRef) {
      handleVNPayResponse(vnp_ResponseCode, vnp_TxnRef)
    }
  }, [searchParams])

  const handleVNPayResponse = async (responseCode: string, txnRef: string) => {
    if (responseCode === '00') {
      const pendingOrder = localStorage.getItem('pendingOrder')
      if (pendingOrder && user?.id) {
        const order = JSON.parse(pendingOrder)
        order.paymentMethod = 'vnpay'
        order.status = 'paid'

        const orderRef = ref(database, `orders/${user.id}/${txnRef}`)
        await set(orderRef, order)
        await createNotification(txnRef, `Đơn hàng mới #${txnRef.slice(-6)} từ ${order.fullName}`)

        const cartRef = ref(database, `carts/${user.id}`);
        await set(cartRef, null);

        localStorage.removeItem('pendingOrder')
        showToast("Thanh toán thành công!", 'success')
        router.push(`/pages/order-confirmation?orderId=${txnRef}`)
      } else {
        showToast("Không tìm thấy thông tin đơn hàng", 'error')
      }
    } else {
      showToast("Thanh toán không thành công", 'error')
    }
  }

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen max-w-7xl">
      <h1 className="text-3xl font-bold mb-4">Thanh Toán</h1>
      <div className="grid lg:grid-cols-2 gap-8 flex-grow">
        <div className="overflow-y-auto">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Thông Tin Giao Hàng</h2>
            <form onSubmit={handleSubmit}>
              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Địa chỉ đã lưu</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {savedAddresses.map((address, index) => (
                      <SavedAddressCard
                        key={index}
                        address={address}
                        isSelected={selectedSavedAddress === index.toString()}
                        onSelect={() => handleSavedAddressSelect(index)}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Họ và Tên</Label>
                  <Input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nhập họ và tên"
                    aria-label="Họ và Tên"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Số Điện Thoại</Label>
                  <Input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="Nhập số điện thoại"
                    aria-label="Số Điện Thoại"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="province">Tỉnh/Thành Phố</Label>
                  <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn Tỉnh/Thành Phố" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.ProvinceID} value={province.ProvinceID.toString()}>
                          {province.ProvinceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district">Quận/Huyện</Label>
                  <Select onValueChange={setSelectedDistrict} value={selectedDistrict} disabled={!selectedProvince}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn Quận/Huyện" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.DistrictID} value={district.DistrictID.toString()}>
                          {district.DistrictName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ward">Phường/Xã</Label>
                  <Select onValueChange={setSelectedWard} value={selectedWard} disabled={!selectedDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn Phường/Xã" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward.WardCode} value={ward.WardCode}>
                          {ward.WardName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="address">Địa Chỉ Chi Tiết</Label>
                <Input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Số nhà, tên đường..."
                  aria-label="Địa Chỉ Chi Tiết"
                />
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Địa chỉ giao hàng</h3>
                <p>{fullName}</p>
                <p>{phoneNumber}</p>
                <p>{address}</p>
                <p>{wards.find(w => w.WardCode === selectedWard)?.WardName}, {districts.find(d => d.DistrictID.toString() === selectedDistrict)?.DistrictName}, {provinces.find(p => p.ProvinceID.toString() === selectedProvince)?.ProvinceName}</p>
              </div>
            </form>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Phương thức thanh toán</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id}>
                    <span className="font-medium">{method.name}</span>
                    <p className="text-sm text-gray-500">
                      {method.description}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </section>
        </div>

        <div className="overflow-y-auto">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Tóm Tắt Đơn Hàng</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center">
                  <Image src={item.imageUrl} alt={item.name} width={50} height={50} className="mr-4" />
                  <div className="flex-grow">
                    <p className="font-semibold">{item.name}</p>
                    <p>Số Lượng: {item.quantity}</p>
                    <p>Giá: {formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Voucher</h3>
            <div className="flex mb-4">
              <Input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Nhập mã voucher"
                className="flex-grow mr-2"
              />
              <Button onClick={handleVoucherCodeSubmit} className="whitespace-nowrap">
                Áp dụng
              </Button>
            </div>
            <div className="mb-4">
              <Label htmlFor="voucherSearch">Tìm kiếm voucher</Label>
              <div className="relative">
                <Input
                  id="voucherSearch"
                  type="text"
                  value={voucherSearchQuery}
                  onChange={(e) => setVoucherSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm voucher"
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredVouchers.map((voucher) => (
                <Card
                  key={voucher.id}
                  className={`cursor-pointer transition-colors ${selectedVoucher?.id === voucher.id ? 'bg-primary/10 border-primary' : ''
                    } ${calculateSubtotal() < voucher.minOrderValue ? 'opacity-50' : ''
                    }`}
                  onClick={() => handleVoucherSelect(voucher)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold">{voucher.voucherCode}</h4>
                        <p className="text-sm text-gray-600">{voucher.description}</p>
                      </div>
                      <div className="flex flex-row sm:flex-col items-start sm:items-end">
                        <span className="text-sm font-medium px-2 py-1 rounded-full bg-primary/10 text-primary mb-1 mr-2 sm:mr-0">
                          {getVoucherStatusLabel(voucher.status)}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${voucher.isExclusive ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                          {voucher.isExclusive ? 'Đặc quyền' : 'Công khai'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <p>Giảm: {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue)}</p>
                      <p>Đơn tối thiểu: {formatCurrency(voucher.minOrderValue)} - Giảm tối đa: {formatCurrency(voucher.maxDiscountAmount)}</p>
                      <p>Còn lại: {voucher.quantity} lượt - Giới hạn: {voucher.usageLimit - (voucher.usedCount || 0)} lần/người</p>
                      <p>Hết hạn: {new Date(voucher.endDate).toLocaleDateString()}</p>
                    </div>
                    {calculateSubtotal() < voucher.minOrderValue && (
                      <p className="mt-2 text-sm text-red-500">Đơn hàng chưa đạt giá trị tối thiểu</p>
                    )}
                    {(voucher.usageLimit - (voucher.usedCount || 0)) <= 0 && (
                      <p className="mt-2 text-sm text-red-500">Hết lượt</p>
                    )}
                    {selectedVoucher?.id === voucher.id && (
                      <Check className="text-primary mt-2 absolute top-2 right-2" size={20} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Tổng cộng</h3>
            <div className="border-t pt-4 mt-4 space-y-2">
              <p className="flex justify-between"><span>Tổng Phụ:</span> <span>{formatCurrency(calculateSubtotal())}</span></p>
              <p className="flex justify-between"><span>Phí Vận Chuyển:</span> <span>{calculateSubtotal() > 2000000 ? "Miễn phí" : formatCurrency(shippingFee)}</span></p>
              {selectedVoucher && (
                <p className="flex justify-between"><span>Giảm giá:</span> <span>-{formatCurrency(calculateDiscount(selectedVoucher))}</span></p>
              )}
              <Separator />
              <p className="flex justify-between font-semibold text-lg"><span>Tổng Cộng:</span> <span>{formatCurrency(calculateTotal())}</span></p>
            </div>
          </section>
        </div>
      </div>
      <div className="mt-4 sticky bottom-0 bg-white p-4 shadow-md">
        <Button type="submit" className="w-full" disabled={isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Đặt Hàng"
          )}
        </Button>
      </div>
    </div>
  )
}

export default function Checkout() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}

