import type { SVGProps } from 'react';

type IconName =
  | 'accessibility_new' | 'add' | 'add_location_alt' | 'add_photo_alternate' | 'admin_panel_settings' | 'alt_route'
  | 'arrow_back' | 'arrow_downward' | 'arrow_forward' | 'arrow_upward' | 'auto_fix_high' | 'balance'
  | 'bolt' | 'calendar_month' | 'calendar_today' | 'chat' | 'chat_bubble' | 'check' | 'check_circle'
  | 'chevron_left' | 'chevron_right' | 'close' | 'cloud' | 'cloud_queue' | 'compare_arrows'
  | 'dashboard' | 'dark_mode' | 'description' | 'diamond' | 'directions_car' | 'directions_walk' | 'dns' | 'download'
  | 'drag_indicator' | 'edit' | 'edit_calendar' | 'equalizer' | 'error' | 'event' | 'event_repeat'
  | 'expand_more' | 'explore' | 'favorite' | 'favorite_border' | 'feedback' | 'fingerprint' | 'flight_takeoff'
  | 'forest' | 'group' | 'groups' | 'handshake' | 'hiking' | 'history' | 'hub' | 'info' | 'insights'
  | 'keyboard_arrow_down' | 'landscape' | 'location_on' | 'lock' | 'login' | 'logout' | 'luggage'
  | 'map' | 'memory' | 'menu' | 'mic' | 'my_location' | 'nightlife' | 'nordic_walking' | 'notifications' | 'payments'
  | 'person' | 'person_add' | 'photo_camera' | 'photo_library' | 'place' | 'print' | 'psychology'
  | 'receipt_long' | 'remove' | 'replay' | 'restaurant' | 'save' | 'savings' | 'schedule' | 'search'
  | 'search_off' | 'send' | 'share' | 'spa' | 'sparkles' | 'star' | 'swap_driving_apps' | 'swap_vert'
  | 'sync' | 'terrain' | 'thermostat' | 'timeline' | 'travel_explore' | 'trending_up' | 'tune'
  | 'verified' | 'verified_user' | 'visibility' | 'visibility_off' | 'volume_off' | 'warning'
  | 'wb_sunny' | 'wb_twilight';

const paths: Record<IconName, string> = {
  accessibility_new: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 7h-5v13h-2v-6h-2v6H9V9H4V7h16v2Z',
  add: 'M12 5v14M5 12h14',
  add_location_alt: 'M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8.5A2.5 2.5 0 1 0 12 7a2.5 2.5 0 0 0 0 5.5Z',
  add_photo_alternate: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 3h.01M4 17l4-4 3 3 2-2 5 5',
  admin_panel_settings: 'M12 2 4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3Zm0 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 2c-2.67 0-4 1.34-4 2.5V17h8v-1.5c0-1.16-1.33-2.5-4-2.5Z',
  alt_route: 'M6 19c4 0 4-6 8-6s4 6 8 6M6 5c4 0 4 6 8 6s4-6 8-6',
  arrow_back: 'M19 12H5m7 7-7-7 7-7',
  arrow_downward: 'M12 5v14m7-7-7 7-7-7',
  arrow_forward: 'M5 12h14m-7-7 7 7-7 7',
  arrow_upward: 'M12 19V5m-7 7 7-7 7 7',
  auto_fix_high: 'm15 4 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM5 5l.7 2.3L8 8l-2.3.7L5 11l-.7-2.3L2 8l2.3-.7L5 5Zm2 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z',
  balance: 'M12 3v18M5 6h14M5 6l-3 6h6L5 6Zm14 0-3 6h6l-3-6ZM8 18h8',
  bolt: 'M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-5.97 10.49Z',
  calendar_month: 'M5 4h14a2 2 0 0 1 2 2v13H3V6a2 2 0 0 1 2-2Zm-2 5h18M8 2v4m8-4v4M7 13h2m2 0h2m2 0h2M7 17h2m2 0h2',
  calendar_today: 'M5 4h14a2 2 0 0 1 2 2v13H3V6a2 2 0 0 1 2-2Zm3-2v4m8-4v4',
  chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Z',
  chat_bubble: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Z',
  check: 'M20 6 9 17l-5-5',
  check_circle: 'm5 12 4 4L19 6M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  chevron_left: 'm15 18-6-6 6-6',
  chevron_right: 'm9 18 6-6-6-6',
  close: 'M6 6l12 12M18 6 6 18',
  cloud: 'M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7Z',
  cloud_queue: 'M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7Z',
  compare_arrows: 'M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3 3m-3-3 3-3',
  dashboard: 'M3 3h8v8H3V3Zm10 0h8v5h-8V3Zm0 9h8v9h-8v-9ZM3 15h8v6H3v-6Z',
  dark_mode: 'M9.37 5.51a7 7 0 1 0 9.12 9.12 7.5 7.5 0 1 1-9.12-9.12Z',
  description: 'M6 3h9l4 4v14H6V3Zm9 0v5h4M9 12h6m-6 4h6',
  diamond: 'm12 3 8 6-8 12L4 9l8-6Zm-8 6h16M9 6l3 15 3-15',
  directions_car: 'm5 16 1.5-6h11l1.5 6M7 16v2m10-2v2M6.5 13h11M8 10l1-3h6l1 3M6 16h.01m12 0h.01',
  directions_walk: 'M13 5a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-3 17 2-7 2 2v5m-2-7-3-3 1-5 4 1 2 3',
  dns: 'M4 4h16v6H4V4zm0 10h16v6H4v-6zm6-8h.01M6 6h.01M6 16h.01M10 16h.01',
  download: 'M12 3v12m0 0 5-5m-5 5-5-5M5 21h14',
  drag_indicator: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z',
  edit_calendar: 'M5 4h14a2 2 0 0 1 2 2v13H3V6a2 2 0 0 1 2-2Zm3-2v4m8-4v4M7 10h3m-3 4h2m4-1 4-4 2 2-4 4-3 1 1-3Z',
  equalizer: 'M10 20h4V4h-4v16Zm-6 0h4v-8H4v8ZM16 9v11h4V9h-4Z',
  error: 'M12 8v4m0 4h.01M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0Z',
  event: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 16H5V10h14v10Z',
  event_repeat: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 16H5V9h14v11Z',
  expand_more: 'm6 9 6 6 6-6',
  explore: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 4-4 2 2-4 4-2Z',
  favorite: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z',
  favorite_border: 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3Zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05Z',
  feedback: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  fingerprint: 'M12 11a3 3 0 0 0-3 3v7m3-13a6 6 0 0 0-6 6v4m6-14a10 10 0 0 0-10 10m10 4v3m0-17a10 10 0 0 1 10 10v4m-4-4v-1a6 6 0 0 0-6-6m6 7v4m-12-3v-2a6 6 0 0 1 6-6',
  flight_takeoff: 'M2 16h20M5 16l3-5-2-2 1-1 4 2 4-6 2 1 1 5-1 4 2 3-1-1-2 3-3 3-1-4-1-3 1-2-2-2-1-1Z',
  forest: 'M8 21h8M12 17v4m0-4 5-5h-3l3-5h-3l2-3-4 2-2-3-2 3-4-2 2 3H5l3 5H5l7 5Z',
  group: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-2a4 4 0 0 0-3-3.9m0-12a4 4 0 0 1 0 7.8',
  groups: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-2a4 4 0 0 0-3-3.9m0-12a4 4 0 0 1 0 7.8',
  handshake: 'M8 11 5 8l-3 3 6 6 3-3m5-3 3-3 3 3-6 6-3-3m-7-6 3-3 4 4 4-4 3 3',
  hiking: 'M13.5 5.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2ZM9 22l1.5-6 2.5 2.5V22h2v-4.5l-2.5-2.5 1-4 2 2V15h2v-3.5l-3-3a1 1 0 0 0-1.4 0l-3.6 3.6L6.5 11 4 12.5l1.5 2.5 2-1 1 7H9Z',
  history: 'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7a6.995 6.995 0 0 1-5.94-3.32L5.6 17.1A8.98 8.98 0 0 0 13 21a9 9 0 0 0 0-18Zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8Z',
  hub: 'M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM4 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 8v8M6.7 10.7l10.6 2.6M6.7 13.3l10.6-2.6',
  info: 'M12 17v-5m0-4h.01M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0Z',
  insights: 'M4 19V5m0 14h16M7 15l3-4 3 2 4-6',
  keyboard_arrow_down: 'm6 9 6 6 6-6',
  landscape: 'M3 19l5-7 4 5 3-4 6 6H3Zm9-10h.01',
  location_on: 'M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8.5A2.5 2.5 0 1 0 12 7a2.5 2.5 0 0 0 0 5.5Z',
  lock: 'M6 10h12v10H6V10Zm3 0V7a3 3 0 0 1 6 0v3',
  login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  luggage: 'M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2 0 .55.45 1 1 1s1-.45 1-1h6c0 .55.45 1 1 1s1-.45 1-1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2ZM11 4h2v2h-2V4Z',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15',
  memory: 'M15 9H9v6h6V9Zm-2 4h-2v-2h2v2Zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2Zm-4 6H7V7h10v10Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0m-6 6v3m-4 0h8',
  my_location: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4Zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06ZM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7Z',
  nightlife: 'M3 18h18M6 18l3-7 3 4 3-6 3 9M12 3v4m-2-2h4',
  nordic_walking: 'M13 5a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-3 17 2-7 2 2v5m-2-7-3-3 1-5 4 1 2 3',
  notifications: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4',
  payments: 'M3 6h18v12H3V6Zm0 4h18m-6 4h3',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z',
  person_add: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Zm6-7V5h-2v2h-2v2h2v2h2V9h2V7h-2Z',
  photo_camera: 'M4 7h4l1.5-2h5L16 7h4v12H4V7Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  photo_library: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 3h.01M4 17l4-4 3 3 2-2 5 5',
  place: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5Z',
  print: 'M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6v-7Z',
  psychology: 'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-.8.7-1 1.2-1 2H9c0-.8-.2-1.3-1-2Z',
  receipt_long: 'M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6m-6 4h4',
  remove: 'M19 13H5v-2h14v2Z',
  replay: 'M4 12a8 8 0 1 0 2.3-5.7L4 9m0-5v5h5',
  restaurant: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7Zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4Z',
  save: 'M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3Zm3-10H5V5h10v4Z',
  savings: 'M15 10c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1Zm4.99 3.52c-.14-.41-.33-.8-.56-1.16l1.24-1.24a.996.996 0 1 0-1.41-1.41l-1.3 1.3c-.63-.5-1.35-.87-2.14-1.07l.63-2.5c.13-.53-.2-1.07-.73-1.2-.53-.13-1.07.2-1.2.73l-.6 2.42c-.61-.06-1.24-.04-1.85.08L11.4 6.8c-.14-.53-.67-.86-1.2-.73-.53.14-.86.67-.73 1.2l.62 2.47c-.77.29-1.48.74-2.07 1.33l-1.3-1.3a.996.996 0 1 0-1.41 1.41l1.24 1.24c-.23.36-.42.75-.56 1.16-.9 2.65.25 5.56 2.66 6.94l.85 2.54c.14.43.54.72.99.72h3.02c.45 0 .85-.29.99-.72l.85-2.54c2.41-1.38 3.56-4.29 2.64-6.98Z',
  schedule: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  search: 'm21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  search_off: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  spa: 'M12 2c-4 4.5-8 9-8 13.5 0 4.5 3.5 6.5 8 6.5s8-2 8-6.5C20 11 16 6.5 12 2Zm0 18c-3.3 0-6-1.5-6-4.5 0-3 3-6.5 6-10 3 3.5 6 7 6 10 0 3-2.7 4.5-6 4.5Z',
  sparkles: 'm12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z',
  star: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z',
  swap_driving_apps: 'M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3 3m-3-3 3-3',
  swap_vert: 'M8 17V3m0 0-4 4m4-4 4 4m4 0v14m0 0-4-4m4 4 4-4',
  sync: 'M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67',
  terrain: 'm3 19 6-8 4 5 3-4 5 7H3Zm7-10h.01',
  thermostat: 'M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0ZM12 5v10',
  timeline: 'M3 17h4l3-6 4 4 4-8 3 2',
  travel_explore: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 4-4 2 2-4 4-2ZM19 19l3 3',
  trending_up: 'm16 6 2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6Z',
  tune: 'M3 17v2h6v-2H3Zm0-10v2h10V7H3Zm10 12v-2h8v-2h-8v-2h-2v6h2ZM7 11v2h14v-2H7Zm8-6v6h2V9h4V7h-4V5h-2Z',
  verified: 'm9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  verified_user: 'm12 3 7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z',
  visibility: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  visibility_off: 'M2 2l20 20M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61',
  volume_off: 'm3 10 4-4h3l4-3v18l-4-3H7l-4-4m14-1 4 4m0-8-4 4',
  warning: 'M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z',
  wb_sunny: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5ZM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1Zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1ZM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1Zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1ZM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58Zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06Zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06ZM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06Z',
  wb_twilight: 'M4 18h16M6 14a6 6 0 0 1 12 0M12 2v3M4.9 4.9 7 7m12.1-2.1L17 7',
};

const additionalPaths: Record<string, string> = {
  account_balance_wallet: paths.payments,
  add_circle: 'M12 8v8m-4-4h8m5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  auto_awesome: paths.sparkles,
  auto_graph: paths.insights,
  block: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM5.6 5.6l12.8 12.8',
  check_box: 'M4 4h16v16H4zM8 12l3 3 5-6',
  check_box_outline_blank: 'M4 4h16v16H4z',
  cloud_off: 'M4 4l16 16M8 8a6 6 0 0 1 10 4 4 4 0 0 1-1 8H7a4 4 0 0 1-2-7',
  delete: 'M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6',
  error_outline: paths.error,
  fact_check: paths.verified,
  file_upload: 'M12 16V3m0 0-5 5m5-5 5 5M4 17v4h16v-4',
  forum: paths.chat,
  gpp_bad: paths.warning,
  image: paths.photo_library,
  inbox: 'M3 4h18v15H3V4Zm0 10h5l2 3h4l2-3h5',
  lightbulb: paths.psychology,
  mark_email_read: paths.check_circle,
  menu_book: paths.description,
  monitoring: paths.equalizer,
  navigation: 'm12 2 8 19-8-5-8 5 8-19Z',
  near_me: 'm3 12 18-9-9 18-2-8-7-1Z',
  open_in_new: 'M13 4h7v7m0-7-9 9m6 1v6H4V7h6',
  pending_actions: paths.schedule,
  play_arrow: 'm8 5 11 7-11 7V5Z',
  priority_high: paths.error,
  query_stats: paths.insights,
  refresh: paths.replay,
  route: paths.alt_route,
  security: paths.verified_user,
  shield: paths.verified_user,
  storage: paths.dns,
  swap_horiz: paths.compare_arrows,
  terminal: 'M4 5h16v14H4V5Zm3 4 3 3-3 3m5 0h5',
  thumb_up: 'M7 10v10H4V10h3Zm2 10h9l2-9h-6l1-7-2-1-4 8v9Z',
  touch_app: 'M12 3v10m-3-3 3 3 3-3m-9 4 2 7h9l2-7',
  upload: 'M12 16V3m0 0-5 5m5-5 5 5M4 17v4h16v-4',
  view_carousel: 'M2 6h3v12H2V6Zm5-2h10v16H7V4Zm12 2h3v12h-3V6Z',
};

export default function Icon({
  name,
  className,
  title,
  size,
  ...props
}: {
  name: string;
  className?: string;
  title?: string;
  size?: number | string;
} & Omit<SVGProps<SVGSVGElement>, 'name' | 'title'>) {
  const path = additionalPaths[name] ?? paths[name as IconName] ?? paths.info;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
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
