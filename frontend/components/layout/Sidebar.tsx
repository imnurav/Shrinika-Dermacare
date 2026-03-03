'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
            <div className="mb-4 flex items-center justify-between gap-2 lg:hidden">
              <h1 className="truncate text-lg font-bold text-white">Shrinika Derma</h1>
              <button
                type="button"
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                onClick={onMobileClose}
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={`hidden items-center justify-between lg:flex ${collapsed ? 'flex-col gap-3' : ''}`}>
              <div>
                <h1 className={`font-bold ${collapsed ? 'text-base text-center' : 'text-xl'}`}>
                  {collapsed ? 'SD' : 'Shrinika Derma'}
                </h1>
                {!collapsed && <p className="mt-1 text-xs text-indigo-200">Admin Dashboard</p>}
              </div>
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                aria-label="Toggle sidebar width"
              >
                {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
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
                    flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg
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
