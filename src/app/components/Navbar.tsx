'use client'

import { Badge } from "@/components/ui/badge";
import { database } from '@/firebaseConfig';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBox, faHome, faInfoCircle, faShoppingCart, faSignOutAlt, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { onValue, ref } from 'firebase/database';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

interface CartItem {
  productId: string;
  quantity: number;
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const [cartItemsCount, setCartItemsCount] = useState(0);

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

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-50">
      {/* Desktop Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:block">
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
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex-shrink-0">
            <span className="text-white text-2xl font-bold">JNX</span>
          </Link>
          <div className="flex items-center">
            <Link href="/pages/cart" className="text-white mr-3 relative">
              <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />
              {cartItemsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  {cartItemsCount}
                </Badge>
              )}
            </Link>
            <button 
              onClick={toggleMobileMenu}
              className="text-white focus:outline-none"
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
                  <MobileNavItem href="/pages/account/profile" icon={faUser} onClick={toggleMobileMenu}>Quản lý tài khoản</MobileNavItem>
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
                <MobileNavItem href="/pages/login" icon={faUser} onClick={toggleMobileMenu}>Đăng nhập</MobileNavItem>
              )}
            </nav>
          </div>
        </div>
      </div>
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

