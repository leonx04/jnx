'use client'

import { Badge } from "@/components/ui/badge";
import { database } from '@/firebaseConfig';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBell, faBox, faHome, faInfoCircle, faShoppingCart, faSignOutAlt, faTimes, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { onValue, ref, update, get, remove } from 'firebase/database';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

interface CartItem {
  productId: string;
  quantity: number;
}

interface Notification {
  id: string;
  orderId: string;
  message: string;
  createdAt: string;
  read: boolean;
  userId: string;
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user || !user.id) return;

    const notificationsRef = ref(database, 'notifications');
    onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationList: Notification[] = Object.entries(data)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // eslint-disable-next-line
          .map(([key, value]: [string, any]) => ({
            id: key,
            ...value,
          }))
          .filter(notification => notification.userId === user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notificationList);
        setUnreadCount(notificationList.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (user && user.id) {
      const cartRef = ref(database, `carts/${user.id}`);
      const unsubscribe = onValue(cartRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const count = Object.values(data as Record<string, CartItem>).reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
          setCartItemsCount(count);
        } else {
          setCartItemsCount(0);
        }
      });

      return () => unsubscribe();
    } else {
      setCartItemsCount(0);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      logout();
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = ref(database, `notifications/${notificationId}`);
      await update(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // eslint-disable-next-line
      const updates: { [key: string]: any } = {};

      snapshot.forEach((childSnapshot) => {
        const notification = childSnapshot.val();
        if (notification.userId === user?.id && !notification.read) {
          updates[`${childSnapshot.key}/read`] = true;
        }
      });

      await update(notificationsRef, updates);
      toast.success('Tất cả thông báo đã được đánh dấu là đã đọc');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông báo');
    }
  };

  const deleteAllReadNotifications = async () => {
    try {
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      const updates: { [key: string]: null } = {};

      snapshot.forEach((childSnapshot) => {
        const notification = childSnapshot.val();
        if (notification.userId === user?.id && notification.read) {
          updates[childSnapshot.key] = null;
        }
      });

      await update(notificationsRef, updates);
      toast.success('Tất cả thông báo đã đọc đã được xóa');
      fetchNotifications(); // Refresh the notifications list
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      toast.error('Có lỗi xảy ra khi xóa thông báo đã đọc');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    window.location.href = `/pages/account/orders/${notification.orderId}`;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-50">
      {/* Desktop Navigation */}
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:block">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-white text-2xl font-bold">JNX</span>
            </Link>
            <div className="ml-10">
              <div className="flex items-baseline space-x-4">
                <NavLink href="/">Trang chủ</NavLink>
                <NavLink href="/pages/products">Sản phẩm</NavLink>
                <NavLink href="/pages/about">Giới thiệu</NavLink>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Link href="/pages/cart" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium mr-2 relative">
              <FontAwesomeIcon icon={faShoppingCart} className="mr-1" />
              {cartItemsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  {cartItemsCount}
                </Badge>
              )}
            </Link>
            {user && (
              <DropdownMenu.Root open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-white">
                    <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" className="w-80 bg-white rounded-md shadow-lg">
                  <div className="flex items-center justify-between px-4 py-2">
                    <h2 className="text-sm font-semibold">Thông báo</h2>
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                        Đánh dấu tất cả đã đọc
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <ScrollArea className="h-[300px]">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <DropdownMenu.Item key={notification.id} className="p-0">
                          <div
                            className="flex items-start w-full p-4 space-x-3 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className={`w-2 h-2 mt-2 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                            <div className="flex-1 space-y-1">
                              <p className={`text-sm ${notification.read ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </DropdownMenu.Item>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Không có thông báo mới
                      </div>
                    )}
                  </ScrollArea>
                  {notifications.length > 0 && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" onClick={deleteAllReadNotifications} className="w-full justify-center">
                        <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                        Xóa thông báo đã đọc
                      </Button>
                    </div>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            )}
            {user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                    <Image
                      src={user.imageUrl || "https://placehold.jp/30x30.png"}
                      alt={user.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full mr-2"
                    />
                    <span>{user.name || user.email}</span>
                    <ChevronDownIcon className="ml-2 h-5 w-5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <DropdownMenu.Item>
                    <Link href="/pages/account/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Quản lý tài khoản
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item>
                    <Link href="/pages/account/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Lịch sử đơn hàng
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item>
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Đăng xuất
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            ) : (
              <NavLink href="/pages/login">Đăng nhập</NavLink>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/" className="flex-shrink-0">
            <span className="text-white text-2xl font-bold">JNX</span>
          </Link>
          <div className="flex items-center">
            <Link href="/pages/cart" className="text-white mr-3 relative">
              <div className="relative inline-block">
                <FontAwesomeIcon icon={faShoppingCart} className="text-2xl" />
                {cartItemsCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-1 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </Badge>
                )}
              </div>
            </Link>
            {user && (
              <Button variant="ghost" size="icon" className="relative text-white mr-3" onClick={() => setShowNotifications(!showNotifications)}>
                <FontAwesomeIcon icon={faBell} className="text-2xl" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-1 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}
            <button
              onClick={toggleMobileMenu}
              className="text-white focus:outline-none ml-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Slide */}
        <div
          className={`fixed inset-0 bg-blue-900 z-40 transform transition-transform duration-300 ease-in-out 
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Close menu button */}
          <button
            onClick={toggleMobileMenu}
            className="absolute top-4 right-4 text-white p-2"
          >
            <FontAwesomeIcon icon={faTimes} className="text-2xl" />
          </button>

          <div className="p-4 pt-16">
            {user ? (
              <div className="flex items-center mb-6 px-4">
                <Image
                  src={user.imageUrl || "https://placehold.jp/30x30.png"}
                  alt={user.name || "User"}
                  width={48}
                  height={48}
                  className="rounded-full mr-4"
                />
                <div>
                  <p className="text-white font-semibold">{user.name || user.email}</p>
                </div>
              </div>
            ) : null}

            <nav className="space-y-2">
              <MobileNavItem href="/" icon={faHome} onClick={toggleMobileMenu}>Trang chủ</MobileNavItem>
              <MobileNavItem href="/pages/products" icon={faBox} onClick={toggleMobileMenu}>Sản phẩm</MobileNavItem>
              <MobileNavItem href="/pages/about" icon={faInfoCircle} onClick={toggleMobileMenu}>Giới thiệu</MobileNavItem>

              {user ? (
                <>
                  <MobileNavItem href="/pages/account/profile" icon={faCheck} onClick={toggleMobileMenu}>Quản lý tài khoản</MobileNavItem>
                  <MobileNavItem href="/pages/account/orders" icon={faShoppingCart} onClick={toggleMobileMenu}>Lịch sử đơn hàng</MobileNavItem>
                  <button
                    onClick={() => {
                      toggleMobileMenu();
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-3 text-white hover:bg-blue-700 flex items-center"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <MobileNavItem href="/pages/login" icon={faCheck} onClick={toggleMobileMenu}>Đăng nhập</MobileNavItem>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Notifications Modal for Mobile */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white w-full h-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Thông báo</h2>
              <button onClick={() => setShowNotifications(false)} className="text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <ScrollArea className="flex-grow">
              {notifications.length > 0 ? (
                <>
                  <div className="flex justify-between items-center p-4 border-b">
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                      Đánh dấu tất cả đã đọc
                    </Button>
                  </div>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b hover:bg-gray-100"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className={`text-sm ${notification.read ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Không có thông báo mới
                </div>
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-4 border-t">
                <Button variant="ghost" size="sm" onClick={deleteAllReadNotifications} className="w-full justify-center">
                  <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                  Xóa thông báo đã đọc
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-white hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
    {children}
  </Link>
);

const MobileNavItem = ({
  href,
  children,
  icon,
  onClick
}: {
  href: string;
  children: React.ReactNode;
  icon: IconDefinition;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="block px-4 py-3 text-white hover:bg-blue-700 flex items-center"
  >
    <FontAwesomeIcon icon={icon} className="mr-3" />
    {children}
  </Link>
);

export default Navbar;

