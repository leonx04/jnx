'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthContext } from '@/app/context/AuthContext'
import { database } from '@/firebaseConfig'
import { ref, onValue, set, remove, runTransaction, get } from 'firebase/database'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'

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

export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [address, setAddress] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [shippingFee, setShippingFee] = useState(0)
  const { user } = useAuthContext()
  const router = useRouter()

  const token = '46e7eac0-6486-11ef-b3c4-52669f455b4f'
  const shopId = 5289630
  const serviceId = 53321

  // Hàm validate form với thông báo chi tiết
  const validateForm = () => {
    const errors: string[] = []

    if (!fullName.trim()) {
      errors.push('Vui lòng nhập đầy đủ họ và tên')
    }

    if (!phoneNumber.trim()) {
      errors.push('Vui lòng nhập số điện thoại')
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phoneNumber)) {
      errors.push('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam')
    }

    if (!selectedProvince) {
      errors.push('Vui lòng chọn Tỉnh/Thành phố')
    }

    if (!selectedDistrict) {
      errors.push('Vui lòng chọn Quận/Huyện')
    }

    if (!selectedWard) {
      errors.push('Vui lòng chọn Phường/Xã')
    }

    if (!address.trim()) {
      errors.push('Vui lòng nhập địa chỉ chi tiết')
    }

    if (cartItems.length === 0) {
      errors.push('Giỏ hàng của bạn đang trống')
    }

    // Hiển thị tất cả lỗi
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return false
    }

    return true
  }

  // Hàm an toàn để lấy email của user
  const getUserEmail = useMemo(() => {
    // Ưu tiên sử dụng user từ context
    if (user?.email) return user.email

    // Nếu không, thử lấy từ sessionStorage
    const storedUser = sessionStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        return parsedUser.email || ''
      } catch (error) {
        console.error('Lỗi khi parse user từ sessionStorage:', error)
        return ''
      }
    }

    return ''
  }, [user])

  // Hàm an toàn để lấy thông tin user
  const getUserDetails = useMemo(() => {
    return {
      userId: getUserEmail,
      userName: user?.name || '',
      userEmail: getUserEmail
    }
  }, [getUserEmail, user])

  useEffect(() => {
    if (getUserEmail) {
      const safeEmail = getUserEmail.replace(/\./g, ',')
      const cartRef = ref(database, `carts/${safeEmail}`)

      const unsubscribe = onValue(cartRef, (snapshot) => {
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
  }, [getUserEmail])

  useEffect(() => {
    fetch('https://online-gateway.ghn.vn/shiip/public-api/master-data/province', {
      headers: { 'Token': token }
    })
      .then(response => response.json())
      .then(data => setProvinces(data.data))
      .catch(error => {
        console.error('Lỗi tải danh sách tỉnh:', error)
        toast.error('Không thể tải danh sách tỉnh')
      })
  }, [])

  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=${selectedProvince}`, {
        headers: { 'Token': token }
      })
        .then(response => response.json())
        .then(data => setDistricts(data.data))
        .catch(error => {
          console.error('Lỗi tải danh sách quận/huyện:', error)
          toast.error('Không thể tải danh sách quận/huyện')
        })

      setSelectedDistrict('')
      setSelectedWard('')
    } else {
      setDistricts([])
    }
  }, [selectedProvince])

  useEffect(() => {
    if (selectedDistrict) {
      fetch(`https://online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${selectedDistrict}`, {
        headers: { 'Token': token }
      })
        .then(response => response.json())
        .then(data => setWards(data.data))
        .catch(error => {
          console.error('Lỗi tải danh sách phường/xã:', error)
          toast.error('Không thể tải danh sách phường/xã')
        })

      setSelectedWard('')
    } else {
      setWards([])
    }
  }, [selectedDistrict])

  const calculateShippingFee = async () => {
    if (!selectedDistrict || !selectedWard) return

    const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0)
    const maxDimensions = cartItems.reduce((max, item) => ({
      length: Math.max(max.length, item.length || 0),
      width: Math.max(max.width, item.width || 0),
      height: Math.max(max.height, item.height || 0),
    }), { length: 0, width: 0, height: 0 })

    try {
      const response = await fetch('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee', {
        method: 'POST',
        headers: {
          'Token': token,
          'ShopId': shopId.toString(),
          'Content-Type': 'application/json'
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

      if (data.code === 200 && data.data && typeof data.data.total === 'number') {
        setShippingFee(data.data.total)
      } else {
        console.error('Invalid response from shipping API:', data)
        setShippingFee(0)
      }
    } catch (error) {
      console.error('Error calculating shipping fee:', error)
      setShippingFee(0)
    }
  }

  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard) {
      calculateShippingFee()
    }
  }, [selectedProvince, selectedDistrict, selectedWard, cartItems, calculateShippingFee])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Kiểm tra thông tin user
    if (!getUserEmail) {
      toast.error('Vui lòng đăng nhập để hoàn tất đơn hàng.')
      return
    }

    try {
      // Kiểm tra số lượng sản phẩm trước khi đặt hàng
      const isStockAvailable = await checkProductStock(cartItems)
      if (!isStockAvailable) {
        toast.error('Một số sản phẩm trong giỏ hàng đã hết hàng hoặc không đủ số lượng. Vui lòng kiểm tra lại.')
        return
      }

      const order = {
        ...getUserDetails,
        fullName,
        phoneNumber,
        items: cartItems,
        shippingAddress: {
          province: provinces.find(p => p.ProvinceID.toString() === selectedProvince)?.ProvinceName ?? '',
          district: districts.find(d => d.DistrictID.toString() === selectedDistrict)?.DistrictName ?? '',
          ward: wards.find(w => w.WardCode === selectedWard)?.WardName ?? '',
          address: address
        },
        subtotal: calculateSubtotal(),
        shippingFee: shippingFee,
        total: calculateTotal(),
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      // Thêm kiểm tra đầy đủ thông tin trước khi đặt hàng
      const orderValidationErrors: string[] = []
      if (!order.userId) orderValidationErrors.push('Thiếu thông tin người dùng')
      if (!order.userEmail) orderValidationErrors.push('Thiếu email')
      if (!order.fullName) orderValidationErrors.push('Thiếu tên')
      if (!order.phoneNumber) orderValidationErrors.push('Thiếu số điện thoại')
      if (order.items.length === 0) orderValidationErrors.push('Giỏ hàng trống')

      if (orderValidationErrors.length > 0) {
        orderValidationErrors.forEach(error => toast.error(error))
        return
      }

      // Tạo đơn hàng
      const safeEmail = getUserEmail.replace(/\./g, ',')
      const orderRef = ref(database, `orders/${safeEmail}/${Date.now()}`)

      await set(orderRef, order)

      // Xóa giỏ hàng
      const cartRef = ref(database, `carts/${safeEmail}`)
      await remove(cartRef)

      // Cập nhật số lượng tồn kho
      const updateStockPromises = cartItems.map(async (item) => {
        const productRef = ref(database, `products/${item.productId}`)
        await runTransaction(productRef, (product) => {
          if (product && product.availableStock !== undefined) {
            product.availableStock -= item.quantity
          }
          return product
        })
      })

      await Promise.all(updateStockPromises)

      toast.success('Đặt hàng thành công!')
      router.push('/pages/order-confirmation')
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error)
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + shippingFee
  }

  const checkProductStock = async (items: CartItem[]) => {
    try {
      const stockCheckPromises = items.map(async (item) => {
        const productRefs = [
          ref(database, `products/${item.productId}`),
          ref(database, `products/${item.id}`)
        ]

        for (const productRef of productRefs) {
          const snapshot = await get(productRef)
          const product = snapshot.val()

          if (product) {
            const availableStock =
              product.availableStock !== undefined ?
                Number(product.availableStock) :
                (product.stock ? Number(product.stock) : 0)

            if (!isNaN(availableStock) && availableStock >= item.quantity) {
              return true
            }
          }
        }

        toast.error(`Không tìm thấy sản phẩm hoặc không đủ tồn kho: ${item.name}`)
        return false
      })

      const stockResults = await Promise.all(stockCheckPromises)
      return stockResults.every(result => result)
    } catch (error) {
      console.error('Lỗi kiểm tra tồn kho:', error)
      toast.error('Không thể kiểm tra tồn kho. Vui lòng thử lại.')
      return false
    }
  }


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Thanh Toán</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Thông Tin Giao Hàng</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="fullName" className="block mb-2">Họ và Tên</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded"
                required
                placeholder="Nhập họ và tên"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="phoneNumber" className="block mb-2">Số Điện Thoại</label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-2 border rounded"
                required
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="province" className="block mb-2">Tỉnh/Thành Phố</label>
              <select
                id="province"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Chọn Tỉnh/Thành Phố</option>
                {provinces.map((province) => (
                  <option key={province.ProvinceID} value={province.ProvinceID.toString()}>{province.ProvinceName}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="district" className="block mb-2">Quận/Huyện</label>
              <select
                id="district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full p-2 border rounded"
                required
                disabled={!selectedProvince}
              >
                <option value="">Chọn Quận/Huyện</option>
                {districts.map((district) => (
                  <option key={district.DistrictID} value={district.DistrictID.toString()}>{district.DistrictName}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="ward" className="block mb-2">Phường/Xã</label>
              <select
                id="ward"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full p-2 border rounded"
                required
                disabled={!selectedDistrict}
              >
                <option value="">Chọn Phường/Xã</option>
                {wards.map((ward) => (
                  <option key={ward.WardCode} value={ward.WardCode}>{ward.WardName}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="address" className="block mb-2">Địa Chỉ Chi Tiết</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border rounded"
                required
                placeholder="Số nhà, tên đường..."
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Đặt Hàng
            </button>
          </form>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Tóm Tắt Đơn Hàng</h2>
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center mb-4">
              <Image src={item.imageUrl} alt={item.name} width={50} height={50} className="mr-4" />
              <div>
                <p className="font-semibold">{item.name}</p>
                <p>Số Lượng: {item.quantity}</p>
                <p>Giá: {item.price.toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>
          ))}
          <div className="border-t pt-4 mt-4">
            <p className="flex justify-between"><span>Tổng Phụ:</span> <span>{calculateSubtotal().toLocaleString('vi-VN')} ₫</span></p>
            <p className="flex justify-between"><span>Phí Vận Chuyển:</span> <span>{shippingFee.toLocaleString('vi-VN')} ₫</span></p>
            <p className="flex justify-between font-semibold text-lg"><span>Tổng Cộng:</span> <span>{calculateTotal().toLocaleString('vi-VN')} ₫</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}