'use client'

import { useAuthContext } from '@/app/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FaEnvelope, FaEye, FaEyeSlash, FaGithub, FaGoogle, FaLock, FaSignInAlt } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle, loginWithGithub } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Địa chỉ email hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (loginMethod: () => Promise<any>) => {
    setIsLoading(true);
    try {
      await loginMethod();
      toast.success('Đăng nhập thành công!');
      router.push('/');
    } catch (err: any) {
      console.error('Social login error:', err);
      if (err.message === 'EMAIL_PASSWORD_ACCOUNT') {
        toast.error('Tài khoản này đã được đăng ký bằng email và mật khẩu. Vui lòng sử dụng phương thức đăng nhập đó.');
      } else if (err.message === 'GOOGLE_ACCOUNT') {
        toast.error('Tài khoản này đã được liên kết với Google. Vui lòng sử dụng đăng nhập bằng Google.');
      } else if (err.message === 'GITHUB_ACCOUNT') {
        toast.error('Tài khoản này đã được liên kết với Github. Vui lòng sử dụng đăng nhập bằng Github.');
      } else if (err.message === 'FACEBOOK_ACCOUNT') {
        toast.error('Tài khoản này đã được liên kết với Facebook. Vui lòng sử dụng đăng nhập bằng Facebook.');
      } else if (err.message === 'ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL') {
        toast.error('Tài khoản này đã được liên kết với một phương thức đăng nhập khác. Vui lòng thử các phương thức khác.');
      } else {
        toast.error('Đăng nhập không thành công. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Đăng nhập</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="login-email">Địa chỉ email</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10"
                  placeholder="Địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="login-password">Mật khẩu</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pl-10 pr-10"
                  placeholder="Mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                  >
                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center"
              disabled={isLoading}
            >
              <FaSignInAlt className="h-5 w-5 mr-2" />
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleSocialLogin(loginWithGoogle)}
              className="w-full inline-flex justify-center items-center"
              variant="outline"
            >
              <FaGoogle className="h-5 w-5 text-red-500" />
            </Button>
            <Button
              onClick={() => handleSocialLogin(loginWithGithub)}
              className="w-full inline-flex justify-center items-center"
              variant="outline"
            >
              <FaGithub className="h-5 w-5 text-gray-900" />
            </Button>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="mt-2 text-sm text-gray-600">
            Bạn chưa có tài khoản?{' '}
            <Link href="/pages/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

