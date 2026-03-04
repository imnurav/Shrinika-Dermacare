'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Package,
  Users,
  UserCircle,
  X,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
  { href: '/dashboard/categories', label: 'Categories', icon: Package },
  { href: '/dashboard/services', label: 'Services', icon: ShoppingBag },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
];

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onMobileClose: () => void;
  onNavigate?: () => void;
};

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onMobileClose,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          ${collapsed ? 'w-20' : 'w-72'}
          bg-gradient-to-b from-slate-900 to-indigo-900 text-white
          transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-all duration-300 ease-in-out
          shadow-xl
        `}
      >
        <div className="flex flex-col h-full">
          <div className="border-b border-indigo-500/40 p-4">
            <div className="relative mb-4 flex flex-col items-center text-center lg:hidden">
              <button
                type="button"
                className="absolute right-0 top-0 rounded-lg bg-white/10 p-2 hover:bg-white/20"
                onClick={onMobileClose}
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
              <Image src="/images/logo.png" alt="Shrinika Dermacare" width={48} height={48} className="h-12 w-12 rounded object-contain" />
              <h1 className="mt-2 text-sm font-bold capitalize text-white">
                {collapsed ? 'SD' : 'Shrinika Dermacare'}
              </h1>
              {!collapsed && <p className="text-[11px] text-indigo-200">Admin Dashboard</p>}
            </div>
            <div className="hidden w-full lg:flex lg:flex-col lg:items-center lg:text-center">
              <Image src="/images/logo.png" alt="Shrinika Dermacare" width={44} height={44} className="h-11 w-11 rounded object-contain" />
              <h1 className={`mt-2 font-bold capitalize ${collapsed ? 'text-xs leading-4' : 'text-base'}`}>
                {collapsed ? 'SD' : 'Shrinika Dermacare'}
              </h1>
              {!collapsed && <p className="mt-1 text-[11px] text-indigo-200">Admin Dashboard</p>}
            </div>
          </div>

          <nav className={`flex-1 p-4 ${collapsed ? 'space-y-3' : 'space-y-2'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                    onMobileClose();
                  }}
                  className={`
                    flex items-center rounded-lg transition-all duration-200
                    ${collapsed ? 'mx-auto h-12 w-12 justify-center px-0' : 'space-x-3 px-4 py-3'}
                    transition-all duration-200
                    ${isActive
                      ? 'bg-white text-indigo-700 shadow-lg'
                      : 'text-indigo-100 hover:bg-indigo-700/80 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} className="opacity-100" />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-indigo-500/40 p-4">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={`flex items-center rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 ${collapsed ? 'mx-auto justify-center' : 'w-full justify-center gap-2'
                }`}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[1px]"
          onClick={onMobileClose}
        />
      )}
    </>
  );
}
