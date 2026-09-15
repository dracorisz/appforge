import React from 'react'
import {
  Archive,
  ArrowLeftRight,
  Binary,
  Box,
  Braces,
  Calendar,
  Camera,
  CloudSun,
  Code,
  Database,
  Eraser,
  FileCode,
  FileText,
  Folder,
  Gamepad2,
  Globe2,
  HardDrive,
  Hash,
  Image,
  Images,
  LayoutDashboard,
  Library,
  Lock,
  Palette,
  QrCode,
  Regex,
  Search,
  Sparkles,
  Table2,
  Type,
  Video,
  Wand2,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const APP_ICON_OPTIONS: Record<string, LucideIcon> = {
  Archive,
  ArrowLeftRight,
  Binary,
  Box,
  Braces,
  Calendar,
  Camera,
  CloudSun,
  Code,
  Database,
  Eraser,
  FileCode,
  FileText,
  Folder,
  Gamepad2,
  Globe2,
  HardDrive,
  Hash,
  Image,
  Images,
  LayoutDashboard,
  Library,
  Lock,
  Palette,
  QrCode,
  Regex,
  Search,
  Sparkles,
  Table2,
  Type,
  Video,
  Wand2,
  Wrench,
}

export const APP_ICON_NAMES = Object.keys(APP_ICON_OPTIONS).sort((a, b) => a.localeCompare(b))

export function getAppIconComponent(name: string): LucideIcon {
  return APP_ICON_OPTIONS[name] || Wrench
}

export function AppIcon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
  const Icon = getAppIconComponent(name)
  return <Icon className={className} aria-hidden="true" />
}
