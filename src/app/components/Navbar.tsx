'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { database } from '@/lib/firebaseConfig';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBell, faBlog, faBox, faCheck, faClockRotateLeft, faHome, faInfoCircle, faRightToBracket, faShoppingCart, faSignOutAlt, faTimes, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { get, onValue, ref, update } from 'firebase/database';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';

interface CartItem {
  productId: string;
  quantity: number;
}

interface Notification {
  id: string;
  orderId?: string;
  voucherId?: string;
  message: string;
  createdAt: string;
  seen: boolean;
  userId: string;
}

const avatarStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
};

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user || !user.id) return;

    const notificationsRef = ref(database, 'notifications');
    onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationList: Notification[] = Object.entries(data)
          .map(([key, value]: [string, any]) => ({
            id: key,
            ...value,
          }))
          .filter(notification => notification.userId === user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notificationList);
        setUnseenCount(notificationList.filter(n => !n.seen).length);
      } else {
        setNotifications([]);
        setUnseenCount(0);
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
      await logout();
      window.location.href = '/pages/login';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const markAsSeen = async (notificationId: string) => {
    try {
      const notificationRef = ref(database, `notifications/${notificationId}`);
      await update(notificationRef, { seen: true });
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  const markAllAsSeen = async () => {
    try {
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      const updates: { [key: string]: any } = {};

      snapshot.forEach((childSnapshot) => {
        const notification = childSnapshot.val();
        if (notification.userId === user?.id && !notification.seen) {
          updates[`${childSnapshot.key}/seen`] = true;
        }
      });

      await update(notificationsRef, updates);
      toast.success('Tất cả thông báo đã được đánh dấu là đã đọc');
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông báo');
    }
  };

  const deleteAllSeenNotifications = async () => {
    try {
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      const updates: { [key: string]: null } = {};

      snapshot.forEach((childSnapshot) => {
        const notification = childSnapshot.val();
        if (notification.userId === user?.id && notification.seen) {
          updates[childSnapshot.key] = null;
        }
      });

      await update(notificationsRef, updates);
      toast.success('Tất cả thông báo đã đọc đã được xóa');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting seen notifications:', error);
      toast.error('Có lỗi xảy ra khi xóa thông báo đã đọc');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.seen) {
      await markAsSeen(notification.id);
    }
    if (notification.orderId) {
      window.location.href = `/pages/account/orders/${notification.orderId}`;
    } else if (notification.voucherId) {
      window.location.href = '/pages/account/profile';
    }
  };

  return (
    <nav className="bg-black text-white shadow-lg sticky top-0 z-50">
      {/* Desktop Navigation */}
      <div className="container-custom hidden md:flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link href="/" className="flex-shrink-0">
            <span className="text-white text-2xl font-bold">JNX</span>
          </Link>
          <div className="ml-10 flex items-baseline space-x-4">
            <NavLink href="/">Trang chủ</NavLink>
            <NavLink href="/pages/products">Sản phẩm</NavLink>
            <NavLink href="/pages/blogs">Blogs</NavLink>
            <NavLink href="/pages/about">Về chúng tôi</NavLink>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <NavIconLink href="/pages/cart" icon={faShoppingCart} badgeCount={cartItemsCount} />
          {user && (
            <NotificationsDropdown
              notifications={notifications}
              unseenCount={unseenCount}
              markAllAsSeen={markAllAsSeen}
              deleteAllSeenNotifications={deleteAllSeenNotifications}
              handleNotificationClick={handleNotificationClick}
            />
          )}
          {user ? (
            <UserDropdown user={user} handleLogout={handleLogout} />
          ) : (
            <NavLink href="/pages/login">Đăng nhập</NavLink>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/" className="flex-shrink-0">
            <span className="text-white text-2xl font-bold">JNX</span>
          </Link>
          <div className="flex items-center space-x-3">
            <NavIconLink href="/" icon={faHome} badgeCount={0} />
            <NavIconLink href="/pages/cart" icon={faShoppingCart} badgeCount={cartItemsCount} />
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                {unseenCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5">
                    {unseenCount}
                  </Badge>
                )}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-white">
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Slide */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={toggleMobileMenu}
          user={user}
          handleLogout={handleLogout}
        />
      </div>

      {/* Notifications Modal for Mobile */}
      <MobileNotifications
        show={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        markAllAsSeen={markAllAsSeen}
        deleteAllSeenNotifications={deleteAllSeenNotifications}
        handleNotificationClick={handleNotificationClick}
      />
    </nav>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-white hover:bg-gray-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
    {children}
  </Link>
);

const NavIconLink = ({ href, icon, badgeCount }: { href: string; icon: IconDefinition; badgeCount: number }) => (
  <Link href={href} className="text-white hover:bg-gray-800 p-2 rounded-md relative">
    <FontAwesomeIcon icon={icon} className="h-5 w-5" />
    {badgeCount > 0 && (
      <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5">
        {badgeCount}
      </Badge>
    )}
  </Link>
);

const NotificationsDropdown = ({
  notifications,
  unseenCount,
  markAllAsSeen,
  deleteAllSeenNotifications,
  handleNotificationClick
}: {
  notifications: Notification[];
  unseenCount: number;
  markAllAsSeen: () => void;
  deleteAllSeenNotifications: () => void;
  handleNotificationClick: (notification: Notification) => void;
}) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <Button variant="ghost" size="icon" className="relative text-white">
        <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
        {unseenCount > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5">
            {unseenCount}
          </Badge>
        )}
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" className="w-80 bg-white rounded-md shadow-lg">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-sm font-semibold text-gray-900">Thông báo</h2>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsSeen} className="text-gray-600 hover:text-gray-900">
            <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>
      <Separator />
      <ScrollArea className="h-[300px]">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenu.Item key={notification.id} className="p-0 focus:bg-gray-100">
              <div
                className="flex items-start w-full p-4 space-x-3 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`w-2 h-2 mt-2 rounded-full ${notification.seen ? 'bg-gray-300' : 'bg-blue-500'}`} />
                <div className="flex-1 space-y-1">
                  <p className={`text-sm ${notification.seen ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
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
          <Button variant="ghost" size="sm" onClick={deleteAllSeenNotifications} className="w-full justify-center text-gray-600 hover:text-gray-900">
            <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
            Xóa thông báo đã đọc
          </Button>
        </div>
      )}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
);

const UserDropdown = ({ user, handleLogout }: { user: any; handleLogout: () => void }) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button className="flex items-center text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium">
        <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
          <Image
            src={user.imageUrl || "https://placehold.jp/30x30.png"}
            alt={user.name || "User"}
            width={32}
            height={32}
            style={avatarStyle}
          />
        </div>
        <span>{user.name || user.email}</span>
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
);

const MobileMenu = ({ isOpen, onClose, user, handleLogout }: { isOpen: boolean; onClose: () => void; user: any; handleLogout: () => void }) => (
  <div
    className={`fixed inset-0 bg-black z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
  >
    <button
      onClick={onClose}
      className="absolute top-4 right-4 text-white p-2"
    >
      <FontAwesomeIcon icon={faTimes} className="text-2xl" />
    </button>

    <div className="p-4 pt-16">
      {user ? (
        <div className="flex items-center mb-6 px-4">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
            <Image
              src={user.imageUrl || "https://placehold.jp/30x30.png"}
              alt={user.name || "User"}
              width={48}
              height={48}
              style={avatarStyle}
            />
          </div>
          <div>
            <p className="text-white font-semibold">{user.name || user.email}</p>
          </div>
        </div>
      ) : null}

      <nav className="space-y-2">
        <MobileNavItem href="/" icon={faHome} onClick={onClose}>Trang chủ</MobileNavItem>
        <MobileNavItem href="/pages/products" icon={faBox} onClick={onClose}>Sản phẩm</MobileNavItem>
        <MobileNavItem href="/pages/blogs" icon={faBlog} onClick={onClose}>Blogs</MobileNavItem>
        <MobileNavItem href="/pages/about" icon={faInfoCircle} onClick={onClose}>Giới thiệu</MobileNavItem>

        {user ? (
          <>
            <MobileNavItem href="/pages/account/profile" icon={faUser} onClick={onClose}>Quản lý tài khoản</MobileNavItem>
            <MobileNavItem href="/pages/account/orders" icon={faClockRotateLeft} onClick={onClose}>Lịch sử đơn hàng</MobileNavItem>
            <button
              onClick={() => {
                onClose();
                handleLogout();
              }}
              className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 flex items-center"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
              Đăng xuất
            </button>
          </>
        ) : (
          <MobileNavItem href="/pages/login" icon={faRightToBracket} onClick={onClose}>Đăng nhập</MobileNavItem>
        )}
      </nav>
    </div>
  </div>
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
    className="block px-4 py-3 text-white hover:bg-gray-800 flex items-center"
  >
    <FontAwesomeIcon icon={icon} className="mr-3 w-5" />
    {children}
  </Link>
);

const MobileNotifications = ({
  show,
  onClose,
  notifications,
  markAllAsSeen,
  deleteAllSeenNotifications,
  handleNotificationClick
}: {
  show: boolean;
  onClose: () => void;
  notifications: Notification[];
  markAllAsSeen: () => void;
  deleteAllSeenNotifications: () => void;
  handleNotificationClick: (notification: Notification) => void;
}) => (
  <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden ${show ? 'block' : 'hidden'}`}>
    <div className="bg-white w-full h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Thông báo</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <ScrollArea className="flex-grow">
        {notifications.length > 0 ? (
          <>
            <div className="flex justify-between items-center p-4 border-b">
              <Button variant="ghost" size="sm" onClick={markAllAsSeen} className="text-gray-600 hover:text-gray-900">
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
                <p className={`text-sm ${notification.seen ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
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
          <Button variant="ghost" size="sm" onClick={deleteAllSeenNotifications} className="w-full justify-center text-gray-600 hover:text-gray-900">
            <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
            Xóa thông báo đã đọc
          </Button>
        </div>
      )}
    </div>
  </div>
);

export default Navbar;
