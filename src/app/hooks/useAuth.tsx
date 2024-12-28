import { app } from '@/firebaseConfig';
import bcrypt from 'bcryptjs';
import { get, getDatabase, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';

// Định nghĩa interface User để mô tả thông tin người dùng
interface User {
  email: string; // Địa chỉ email của người dùng
  name?: string; // Tên người dùng (tuỳ chọn)
  imageUrl?: string; // URL ảnh đại diện của người dùng (tuỳ chọn)
  id?: string; // ID người dùng trong cơ sở dữ liệu (tuỳ chọn)
}

// Kế thừa từ User và thêm trường password cho việc xử lý đăng nhập
interface UserWithPassword extends User {
  password: string; // Mật khẩu được hash của người dùng
}

// Thời gian hết hạn của token, được đặt là 1 tiếng (tính bằng milliseconds)
const TOKEN_EXPIRY_TIME = 60 * 60 * 1000;

// Hàm tạo token với giá trị ngẫu nhiên và thời gian hết hạn
const generateToken = () => {
  return {
    value: Math.random().toString(36).substr(2), // Sinh giá trị token ngẫu nhiên
    expiry: Date.now() + TOKEN_EXPIRY_TIME // Thời gian hết hạn của token
  };
};

// Hàm kiểm tra tính hợp lệ của token dựa trên thời gian hết hạn
export const isTokenValid = (token: { value: string; expiry: number }) => {
  return token.expiry > Date.now(); // Token hợp lệ nếu chưa hết hạn
};

// Hook xử lý xác thực người dùng
export function useAuth() {
  const [user, setUser] = useState<User | null>(null); // Lưu trạng thái người dùng hiện tại

  // useEffect để kiểm tra và khôi phục thông tin người dùng từ localStorage khi tải lại trang
  useEffect(() => {
    const storedUser = localStorage.getItem('user'); // Lấy thông tin người dùng từ localStorage
    const storedToken = localStorage.getItem('token'); // Lấy token từ localStorage

    if (storedUser && storedToken) {
      const parsedToken = JSON.parse(storedToken);
      if (isTokenValid(parsedToken)) {
        // Nếu token hợp lệ, khôi phục thông tin người dùng
        setUser(JSON.parse(storedUser));
      } else {
        // Xoá thông tin nếu token đã hết hạn
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Hàm đăng nhập, thực hiện xác thực người dùng với Firebase
  const login = async (email: string, password: string): Promise<User> => {
    console.log(`Attempting login with email: ${email}`); // Log email người dùng
    const db = getDatabase(app); // Kết nối cơ sở dữ liệu Firebase
    const usersRef = ref(db, 'user'); // Tham chiếu đến danh sách người dùng

    try {
      const snapshot = await get(usersRef); // Lấy dữ liệu từ Firebase
      console.log('Firebase snapshot received:', snapshot.val());

      if (snapshot.exists()) {
        const users = snapshot.val(); // Lấy danh sách người dùng từ snapshot
        for (const userId in users) {
          const user = users[userId] as UserWithPassword;
          if (user.email === email) {
            // So sánh mật khẩu nhập vào với mật khẩu đã được hash
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
              console.log('User found:', user);
              const { password: _, ...userWithoutPassword } = user; // Loại bỏ trường password
              const userWithId = { ...userWithoutPassword, id: userId }; // Thêm ID người dùng
              const token = generateToken(); // Tạo token mới
              localStorage.setItem('token', JSON.stringify(token)); // Lưu token vào localStorage
              localStorage.setItem('user', JSON.stringify(userWithId)); // Lưu thông tin người dùng
              setUser(userWithId); // Cập nhật trạng thái người dùng
              return userWithId; // Trả về thông tin người dùng
            }
          }
        }
        console.log('No matching user found'); // Không tìm thấy người dùng phù hợp
      } else {
        console.log('No users found in the database'); // Cơ sở dữ liệu không có người dùng
      }
    } catch (error) {
      console.error('Firebase query error:', error); // Xử lý lỗi Firebase
    }

    throw new Error('Invalid email or password'); // Báo lỗi nếu thông tin không hợp lệ
  };

  // Hàm đăng xuất người dùng
  const logout = () => {
    localStorage.removeItem('user'); // Xoá thông tin người dùng khỏi localStorage
    localStorage.removeItem('token'); // Xoá token khỏi localStorage
    setUser(null); // Đặt trạng thái người dùng về null
  };

  // Hàm cập nhật thông tin người dùng
  const updateUser = async (updatedUser: User) => {
    if (user && user.id) {
      const db = getDatabase(app); // Kết nối cơ sở dữ liệu
      const userRef = ref(db, `user/${user.id}`); // Tham chiếu đến người dùng cụ thể
      await set(userRef, updatedUser); // Cập nhật dữ liệu trong Firebase
      setUser(updatedUser); // Cập nhật trạng thái người dùng
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Lưu thông tin mới vào localStorage
    }
  };

  // Trả về các phương thức và trạng thái của hook
  return { user, login, logout, updateUser };
}
