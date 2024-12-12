'use client'

import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { app } from '@/firebaseConfig';
import { getDatabase, push, ref, set } from 'firebase/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser, FaUserPlus } from 'react-icons/fa';

interface TurnstileInstance {
  render: (selector: string, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
}

declare global {
  interface Window {
    turnstile: TurnstileInstance;
    onloadTurnstileCallback?: () => void;
  }
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaWidgetId, setCaptchaWidgetId] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const renderCaptcha = useCallback(() => {
    if (window.turnstile) {
      const widgetId = window.turnstile.render('#cloudflare-turnstile', {
        sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY || '',
        callback: (token: string) => {
          setCaptchaToken(token);
        },
      });
      setCaptchaWidgetId(widgetId);
    }
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    window.onloadTurnstileCallback = renderCaptcha;

    return () => {
      document.body.removeChild(script);
      delete window.onloadTurnstileCallback;
    };
  }, [renderCaptcha]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      toast.error('Bạn phải đồng ý với điều khoản và điều kiện');
      setIsLoading(false);
      return;
    }

    if (!captchaToken) {
      toast.error('Vui lòng hoàn thành CAPTCHA');
      setIsLoading(false);
      return;
    }

    try {
      const db = getDatabase(app);
      const usersRef = ref(db, 'user');
      const newUserRef = push(usersRef);
      await set(newUserRef, {
        name,
        email,
        password, // Note: In a real application, you should hash the password before storing it
      });

      toast.success('Đăng ký thành công!');
      router.push('/pages/login');
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      if (window.turnstile && captchaWidgetId) {
        window.turnstile.reset(captchaWidgetId);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 to-blue-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Tạo tài khoản mới</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên của bạn
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                  >
                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                  >
                    {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <Checkbox
              id="accept-terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <label
              htmlFor="accept-terms"
              className="ml-2 block text-sm text-gray-900 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setShowTerms(true);
              }}
            >
              Tôi đồng ý với <span className="font-medium text-indigo-600 hover:text-indigo-500">điều khoản và điều kiện</span>
            </label>
          </div>

          <div id="cloudflare-turnstile" className="mt-4"></div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FaUserPlus className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
              </span>
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600">
            Bạn đã có tài khoản?{' '}
            <Link href="/pages/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
        <Modal
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          title="Điều khoản và Điều kiện"
          onConfirm={() => {
            setAcceptTerms(true);
            setShowTerms(false);
          }}
        >
          <p>Chào mừng bạn đến với website của chúng tôi! Khi sử dụng dịch vụ hoặc mua sắm tại đây, bạn đồng ý với các điều khoản và điều kiện sau:</p>
          <ol className="list-decimal pl-4">
            <li>
              <strong>Điều kiện sử dụng:</strong> Bạn phải từ 18 tuổi trở lên hoặc có sự giám sát của người lớn khi truy cập và sử dụng website này.
            </li>
            <li>
              <strong>Thông tin sản phẩm:</strong> Chúng tôi cố gắng cung cấp thông tin chính xác nhất về các sản phẩm, nhưng không đảm bảo không có lỗi xảy ra.
            </li>
            <li>
              <strong>Thanh toán:</strong> Tất cả giao dịch phải được thực hiện thông qua các phương thức thanh toán hợp lệ được hỗ trợ trên website.
            </li>
            <li>
              <strong>Chính sách đổi trả:</strong> Sản phẩm chỉ được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng, với điều kiện còn nguyên vẹn và có hóa đơn mua hàng.
            </li>
            <li>
              <strong>Bảo mật thông tin:</strong> Chúng tôi cam kết bảo mật thông tin cá nhân của bạn và không chia sẻ cho bên thứ ba nếu không có sự đồng ý.
            </li>
            <li>
              <strong>Quyền sở hữu trí tuệ:</strong> Mọi nội dung trên website (bao gồm hình ảnh, văn bản) đều thuộc quyền sở hữu của chúng tôi và không được sử dụng trái phép.
            </li>
            <li>
              <strong>Giới hạn trách nhiệm:</strong> Chúng tôi không chịu trách nhiệm đối với bất kỳ thiệt hại nào phát sinh từ việc sử dụng website hoặc sản phẩm.
            </li>
            <li>
              <strong>Thay đổi điều khoản:</strong> Chúng tôi có quyền thay đổi điều khoản bất cứ lúc nào. Mọi thay đổi sẽ được cập nhật trên website.
            </li>
          </ol>
          <p>Nếu bạn có bất kỳ câu hỏi nào về các điều khoản trên, vui lòng liên hệ với chúng tôi qua email hoặc số điện thoại hỗ trợ.</p>
        </Modal>

      </div>
    </div>
  );
}

