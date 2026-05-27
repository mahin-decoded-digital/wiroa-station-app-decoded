import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Home,
  HardHat,
  Vote,
  CreditCard,
  FolderOpen,
  Leaf,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const nav = [
  { to: '/dashboard', label: 'Overview', icon: Home },
  { to: '/construction', label: 'Construction', icon: HardHat },
  { to: '/elections', label: 'Advisory Board', icon: Vote },
  { to: '/levies', label: 'Levy Payments', icon: CreditCard },
  { to: '/documents', label: 'Document Vault', icon: FolderOpen },
  { to: '/iwi', label: 'Iwi Liaison', icon: Leaf },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleLabel: Record<string, string> = {
    owner: 'Co-owner',
    manager: 'Estate Manager',
    board_member: 'Board Member',
    admin: 'Administrator',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-parchment)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-background transition-transform duration-[220ms]',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ boxShadow: 'var(--shadow-panel)' }}
      >
        {/* Wordmark */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div>
            <p
              className="text-base font-semibold tracking-wide text-foreground"
              style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.04em' }}
            >
              Wiroa Station
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Estate Platform
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-[150ms]',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <ChevronRight size={14} className="text-primary/60" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          {currentUser && (
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              >
                {currentUser.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {currentUser.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleLabel[currentUser.role] ?? currentUser.role}
                  {currentUser.lotNumber ? ` · Lot ${currentUser.lotNumber}` : ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex h-14 items-center border-b border-border bg-background px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-muted-foreground hover:text-foreground mr-3"
          >
            <Menu size={20} />
          </button>
          <p
            className="text-base font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Wiroa Station
          </p>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
