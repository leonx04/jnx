'use client'; // Chỉ định đây là file chạy trên phía client trong ứng dụng Next.js

// Import các module cần thiết từ React và các hook tuỳ chỉnh
import React, { createContext, useContext, useEffect, useState } from 'react';
import { isTokenValid, useAuth } from '../hooks/useAuth';

// Định nghĩa interface AuthContextType mô tả các phương thức và trạng thái của context
interface AuthContextType {
  user: User | null; // Trạng thái người dùng hiện tại (null nếu chưa đăng nhập)
  login: (email: string, password: string) => Promise<User>; // Hàm đăng nhập
  logout: () => void; // Hàm đăng xuất
  updateUserInfo: (updatedUser: User) => Promise<void>; // Hàm cập nhật thông tin người dùng
}

// Định nghĩa interface User để mô tả cấu trúc dữ liệu người dùng
interface User {
  email: string; // Email của người dùng
  name?: string; // Tên người dùng (tuỳ chọn)
  imageUrl?: string; // URL ảnh đại diện của người dùng (tuỳ chọn)
  id?: string; // ID người dùng trong cơ sở dữ liệu (tuỳ chọn)
}

// Tạo một context để quản lý trạng thái xác thực người dùng
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider cung cấp AuthContext cho toàn bộ ứng dụng
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth(); // Sử dụng hook xác thực
  const [user, setUser] = useState<User | null>(auth.user); // Lưu trạng thái người dùng

  // Kiểm tra và khôi phục thông tin người dùng từ localStorage khi tải trang
  useEffect(() => {
    const storedUser = localStorage.getItem('user'); // Lấy người dùng từ localStorage
    const storedToken = localStorage.getItem('token'); // Lấy token từ localStorage

    if (storedUser && storedToken) {
      const parsedToken = JSON.parse(storedToken);
      if (isTokenValid(parsedToken)) {
        // Nếu token hợp lệ, khôi phục trạng thái người dùng
        setUser(JSON.parse(storedUser));
      } else {
        // Xoá thông tin nếu token đã hết hạn
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Hàm đăng nhập người dùng
  const login = async (email: string, password: string) => {
    const loggedInUser = await auth.login(email, password); // Gọi hàm login từ hook
    setUser(loggedInUser); // Cập nhật trạng thái người dùng
    return loggedInUser; // Trả về thông tin người dùng đã đăng nhập
  };

  // Hàm đăng xuất người dùng
  const logout = () => {
    auth.logout(); // Gọi hàm logout từ hook
    setUser(null); // Đặt trạng thái người dùng về null
  };

  // Hàm cập nhật thông tin người dùng
  const updateUserInfo = async (updatedUser: User) => {
    await auth.updateUser(updatedUser); // Gọi hàm updateUser từ hook
    setUser(updatedUser); // Cập nhật trạng thái người dùng
    localStorage.setItem('user', JSON.stringify(updatedUser)); // Lưu thông tin mới vào localStorage
  };

  // Trả về Provider chứa các phương thức và trạng thái xác thực
  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook sử dụng AuthContext
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Nếu AuthContext chưa được bao bọc bởi AuthProvider, báo lỗi
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context; // Trả về context hiện tại
};
