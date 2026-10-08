'use client';

import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';

interface NotificationModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

export default function NotificationModal({ title, message, onClose }: NotificationModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'Tab') {
        const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1D4F]/55 px-4 py-6" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="notification-title" aria-describedby="notification-message" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id="notification-title" className="font-headline-sm text-lg font-bold text-[#0E1D4F]">{title}</h2>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Đóng thông báo" className="rounded-lg p-2 text-[#4B5875] hover:bg-[#EBF1F0] focus-visible:outline-2 focus-visible:outline-[#205BD6]"><Icon name="close" className="size-5" /></button>
        </div>
        <p id="notification-message" className="mt-3 text-sm leading-relaxed text-[#4B5875]">{message}</p>
        <button type="button" onClick={onClose} className="mt-6 min-h-11 w-full rounded-xl bg-[#205BD6] px-4 py-2 font-semibold text-white hover:bg-[#1847a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205BD6]">Đã hiểu</button>
      </div>
    </div>
  );
}
