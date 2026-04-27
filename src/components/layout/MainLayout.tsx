/**
 * Main Layout Component
 * TitleBar at top, then sidebar + content below.
 */
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';

export function MainLayout() {
  return (
    <div data-testid="main-layout" className="bajo-app-shell flex h-screen flex-col overflow-hidden">
      {/* Title bar: drag region on macOS, icon + controls on Windows */}
      <TitleBar />
      <div aria-hidden="true" className="bajo-brand-line h-[2px] shrink-0" />

      {/* Below the title bar: sidebar + content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main data-testid="main-content" className="bajo-main-surface min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
