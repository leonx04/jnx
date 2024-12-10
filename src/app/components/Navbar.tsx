'use client'

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import Image from 'next/image';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { ref, onValue } from 'firebase/database';
import { database } from '@/firebaseConfig';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    if (user) {
      const cartRef = ref(database, `carts/${user.email.replace('.', ',')}`);
      onValue(cartRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const count = Object.values(data).reduce((acc: number, item: any) => acc + item.quantity, 0);
          setCartItemsCount(count);
        } else {
          setCartItemsCount(0);
        }
      });
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

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-white text-2xl font-bold">JNX</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <NavLink href="/">Trang chủ</NavLink>
                <NavLink href="/pages/products">Sản phẩm</NavLink>
                <NavLink href="/pages/about">Giới thiệu</NavLink>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <Link href="/pages/cart" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium mr-2 relative">
                <FontAwesomeIcon icon={faShoppingCart} className="mr-1" />
                
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              {user ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                      <Image
                        src={user.imageUrl || "/placeholder.svg"}
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
                    <DropdownMenu.Item className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Link href="/pages/account">Quản lý tài khoản</Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <button onClick={handleLogout} className="w-full text-left">
                        Đăng xuất
                      </button>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              ) : (
                <div className="flex space-x-4">
                  <NavLink href="/pages/login">Đăng nhập</NavLink>
                </div>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <MobileNavLink href="/">Trang chủ</MobileNavLink>
          <MobileNavLink href="/pages/products">Sản phẩm</MobileNavLink>
          <MobileNavLink href="/pages/about">Giới thiệu</MobileNavLink>
          <MobileNavLink href="/pages/cart">
            <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
            
          </MobileNavLink>
          {user ? (
            <>
              <div className="flex items-center px-3 py-2">
                <Image
                  src={user.imageUrl || "/placeholder.svg"}
                  alt={user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full mr-2"
                />
                <span className="text-white">{user.name || user.email}</span>
              </div>
              <MobileNavLink href="/pages/account">Quản lý tài khoản</MobileNavLink>
              <button
                onClick={handleLogout}
                className="text-white hover:bg-blue-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <MobileNavLink href="/pages/login">Đăng nhập</MobileNavLink>
            </>
          )}
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

const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-white hover:bg-blue-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
    {children}
  </Link>
);

export default Navbar;

