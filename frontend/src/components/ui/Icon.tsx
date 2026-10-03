import type { SVGProps } from 'react';

type IconName =
  | 'add' | 'add_location_alt' | 'add_photo_alternate' | 'alt_route' | 'arrow_back'
  | 'arrow_forward' | 'auto_fix_high' | 'balance' | 'calendar_month' | 'calendar_today'
  | 'check_circle' | 'close' | 'cloud' | 'cloud_queue' | 'compare_arrows' | 'description'
  | 'diamond' | 'directions_car' | 'directions_walk' | 'download' | 'drag_indicator'
  | 'edit_calendar' | 'expand_more' | 'explore' | 'fingerprint' | 'flight_takeoff' | 'forest' | 'group'
  | 'groups' | 'handshake' | 'info' | 'insights' | 'keyboard_arrow_down' | 'landscape' | 'location_on' | 'lock' | 'map'
  | 'menu' | 'mic' | 'nightlife' | 'nordic_walking' | 'payments' | 'photo_camera' | 'photo_library'
  | 'print' | 'psychology' | 'receipt_long' | 'replay' | 'schedule' | 'search' | 'share'
  | 'swap_driving_apps' | 'swap_vert' | 'terrain' | 'thermostat' | 'timeline' | 'travel_explore'
  | 'verified' | 'verified_user' | 'visibility' | 'volume_off' | 'wb_twilight';

const paths: Record<IconName, string> = {
  add: 'M12 5v14M5 12h14',
  add_location_alt: 'M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8.5A2.5 2.5 0 1 0 12 7a2.5 2.5 0 0 0 0 5.5Z',
  add_photo_alternate: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 3h.01M4 17l4-4 3 3 2-2 5 5',
  alt_route: 'M6 19c4 0 4-6 8-6s4 6 8 6M6 5c4 0 4 6 8 6s4-6 8-6',
  arrow_back: 'M19 12H5m7 7-7-7 7-7',
  arrow_forward: 'M5 12h14m-7-7 7 7-7 7',
  auto_fix_high: 'm15 4 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM5 5l.7 2.3L8 8l-2.3.7L5 11l-.7-2.3L2 8l2.3-.7L5 5Zm2 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z',
  balance: 'M12 3v18M5 6h14M5 6l-3 6h6L5 6Zm14 0-3 6h6l-3-6ZM8 18h8',
  calendar_month: 'M5 4h14a2 2 0 0 1 2 2v13H3V6a2 2 0 0 1 2-2Zm-2 5h18M8 2v4m8-4v4M7 13h2m2 0h2m2 0h2M7 17h2m2 0h2',
  calendar_today: 'M5 4h14a2 2 0 0 1 2 2v13H3V6a2 2 0 0 1 2-2Zm3-2v4m8-4v4',
  check_circle: 'm5 12 4 4L19 6M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  close: 'M6 6l12 12M18 6 6 18',
  cloud: 'M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7Z',
  cloud_queue: 'M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7Z',
  compare_arrows: 'M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3 3m-3-3 3-3',
  description: 'M6 3h9l4 4v14H6V3Zm9 0v5h4M9 12h6m-6 4h6',
  diamond: 'm12 3 8 6-8 12L4 9l8-6Zm-8 6h16M9 6l3 15 3-15',
  directions_car: 'm5 16 1.5-6h11l1.5 6M7 16v2m10-2v2M6.5 13h11M8 10l1-3h6l1 3M6 16h.01m12 0h.01',
  directions_walk: 'M13 5a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-3 17 2-7 2 2v5m-2-7-3-3 1-5 4 1 2 3',
  download: 'M12 3v12m0 0 5-5m-5 5-5-5M5 21h14',
  drag_indicator: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  edit_calendar: 'M5 4h14a2 2 0 0 1 2 2v13H3V6a2 2 0 0 1 2-2Zm3-2v4m8-4v4M7 10h3m-3 4h2m4-1 4-4 2 2-4 4-3 1 1-3Z',
  expand_more: 'm6 9 6 6 6-6',
  explore: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 4-4 2 2-4 4-2Z',
  fingerprint: 'M12 11a3 3 0 0 0-3 3v7m3-13a6 6 0 0 0-6 6v4m6-14a10 10 0 0 0-10 10m10 4v3m0-17a10 10 0 0 1 10 10v4m-4-4v-1a6 6 0 0 0-6-6m6 7v4m-12-3v-2a6 6 0 0 1 6-6',
  flight_takeoff: 'M2 16h20M5 16l3-5-2-2 1-1 4 2 4-6 2 1 1 5-1 4 2 3-1-1-2 3-3 3-1-4-1-3 1-2-2-2-1-1Z',
  forest: 'M8 21h8M12 17v4m0-4 5-5h-3l3-5h-3l2-3-4 2-2-3-2 3-4-2 2 3H5l3 5H5l7 5Z',
  group: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-2a4 4 0 0 0-3-3.9m0-12a4 4 0 0 1 0 7.8',
  groups: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-2a4 4 0 0 0-3-3.9m0-12a4 4 0 0 1 0 7.8',
  handshake: 'M8 11 5 8l-3 3 6 6 3-3m5-3 3-3 3 3-6 6-3-3m-7-6 3-3 4 4 4-4 3 3',
  info: 'M12 17v-5m0-4h.01M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0Z',
  insights: 'M4 19V5m0 14h16M7 15l3-4 3 2 4-6',
  keyboard_arrow_down: 'm6 9 6 6 6-6',
  landscape: 'M3 19l5-7 4 5 3-4 6 6H3Zm9-10h.01',
  location_on: 'M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8.5A2.5 2.5 0 1 0 12 7a2.5 2.5 0 0 0 0 5.5Z',
  lock: 'M6 10h12v10H6V10Zm3 0V7a3 3 0 0 1 6 0v3',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15',
  menu: 'M4 6h16M4 12h16M4 18h16',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0m-6 6v3m-4 0h8',
  nightlife: 'M3 18h18M6 18l3-7 3 4 3-6 3 9M12 3v4m-2-2h4',
  nordic_walking: 'M13 5a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-3 17 2-7 2 2v5m-2-7-3-3 1-5 4 1 2 3',
  payments: 'M3 6h18v12H3V6Zm0 4h18m-6 4h3',
  photo_camera: 'M4 7h4l1.5-2h5L16 7h4v12H4V7Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  photo_library: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 3h.01M4 17l4-4 3 3 2-2 5 5',
  print: 'M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6v-7Z',
  psychology: 'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-.8.7-1 1.2-1 2H9c0-.8-.2-1.3-1-2Z',
  receipt_long: 'M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6m-6 4h4',
  replay: 'M4 12a8 8 0 1 0 2.3-5.7L4 9m0-5v5h5',
  schedule: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  search: 'm21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  swap_driving_apps: 'M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3 3m-3-3 3-3',
  swap_vert: 'M8 17V3m0 0-4 4m4-4 4 4m4 0v14m0 0-4-4m4 4 4-4',
  terrain: 'm3 19 6-8 4 5 3-4 5 7H3Zm7-10h.01',
  thermostat: 'M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0ZM12 5v10',
  timeline: 'M3 17h4l3-6 4 4 4-8 3 2',
  travel_explore: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 4-4 2 2-4 4-2ZM19 19l3 3',
  verified: 'm9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  verified_user: 'm12 3 7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z',
  visibility: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  volume_off: 'm3 10 4-4h3l4-3v18l-4-3H7l-4-4m14-1 4 4m0-8-4 4',
  wb_twilight: 'M4 18h16M6 14a6 6 0 0 1 12 0M12 2v3M4.9 4.9 7 7m12.1-2.1L17 7',
};

export default function Icon({ name, className, title, ...props }: { name: string; className?: string; title?: string } & Omit<SVGProps<SVGSVGElement>, 'name' | 'title'>) {
  const path = paths[name as IconName] ?? paths.info;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 align-middle ${className ?? ''}`}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d={path} />
    </svg>
  );
}
