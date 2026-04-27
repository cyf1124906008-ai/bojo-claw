/**
 * TitleBar Component
 * macOS: empty drag region (native traffic lights handled by hiddenInset).
 * Windows: drag region with custom minimize/maximize/close controls.
 * Linux: use native window chrome (no custom title bar).
 */
import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy, ShieldCheck } from 'lucide-react';
import { invokeIpc } from '@/lib/api-client';
import logoPng from '@/assets/logo.png';

export function TitleBar() {
  const platform = window.electron?.platform;

  if (platform === 'darwin') {
    // macOS: just a drag region, traffic lights are native
    return <div className="drag-region bojo-titlebar h-11 shrink-0 border-b border-black/10 dark:border-white/10" />;
  }

  // Linux keeps the native frame/title bar for better IME compatibility.
  if (platform !== 'win32') {
    return null;
  }

  return <WindowsTitleBar />;
}

function WindowsTitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    // Check initial state
    invokeIpc('window:isMaximized').then((val) => {
      setMaximized(val as boolean);
    });
  }, []);

  const handleMinimize = () => {
    invokeIpc('window:minimize');
  };

  const handleMaximize = () => {
    invokeIpc('window:maximize').then(() => {
      invokeIpc('window:isMaximized').then((val) => {
        setMaximized(val as boolean);
      });
    });
  };

  const handleClose = () => {
    invokeIpc('window:close');
  };

  return (
    <div className="drag-region bojo-titlebar flex h-11 shrink-0 items-center justify-between border-b border-black/10 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-3 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/70 shadow-sm ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/10">
          <img src={logoPng} alt="BojoClaw" className="h-4 w-4 dark:invert" />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">BojoClaw</span>
          <span className="hidden h-4 w-px bg-black/15 dark:bg-white/15 sm:block" />
          <span className="hidden text-[12px] font-medium text-foreground/60 sm:inline">BojoSeek 桌面工作台</span>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-black/10 bg-white/40 px-2 py-0.5 text-[11px] font-medium text-foreground/70 dark:border-white/10 dark:bg-white/10 md:flex">
          <ShieldCheck className="h-3 w-3 text-[hsl(var(--bojo-blue))]" />
          内置 OpenClaw
        </div>
      </div>

      <div className="no-drag flex h-full">
        <button
          onClick={handleMinimize}
          className="flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
          title="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
          title={maximized ? 'Restore' : 'Maximize'}
        >
          {maximized ? <Copy className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={handleClose}
          className="flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
