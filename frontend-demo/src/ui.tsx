import { useEffect, useRef, type ReactNode } from 'react'
import { X, LoaderCircle, MapPin, Utensils, Coffee, BedDouble, Trees, Landmark } from 'lucide-react'
import type { Kind } from './types'
export const kinds: Record<Kind, string> = {attraction: 'Tham quan', food: 'Ăn uống', cafe: 'Cà phê', stay: 'Lưu trú', activity: 'Trải nghiệm', other: 'Khác'}
export const kindIcons = {attraction: Landmark, food: Utensils, cafe: Coffee, stay: BedDouble, activity: Trees, other: MapPin}
export const expenseLabels: Record<string, string> = {transport: 'Di chuyển', food: 'Ăn uống', stay: 'Lưu trú', tickets: 'Tham quan', other: 'Khác'}
export function Spinner() { return <LoaderCircle size={18} className="spin" aria-label="Đang tải" /> }
export function Notice({children, error = false}: {children: ReactNode; error?: boolean}) { return <div className={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div> }
export function Modal({title, children, onClose, locked = false}: {title: string; children: ReactNode; onClose: () => void; locked?: boolean}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    ref.current?.showModal()
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = old
      prevFocus?.focus?.()
    }
  }, [])
  return <dialog ref={ref} className="modal" onCancel={e => {e.preventDefault(); if (!locked) onClose()}} onClick={e => {if (e.target === e.currentTarget && !locked) onClose()}} aria-label={title}>
    <div className="modal-inner"><header><h2>{title}</h2><button className="icon-button" onClick={onClose} disabled={locked} aria-label="Đóng"><X size={20} /></button></header>{children}</div>
  </dialog>
}
export const qualityLabel = (quality: string) => quality === 'verified' ? 'Đã kiểm chứng' : quality === 'schedulable' ? 'Có thể lập lịch' : 'Chờ kiểm chứng'
export const canSchedule = (quality: string) => ['verified', 'schedulable'].includes(quality)
