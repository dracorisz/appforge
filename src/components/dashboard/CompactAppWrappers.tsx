import React from 'react'
import { TaskList as TaskListCore } from './TaskList'
import { PF_CryptoTrack as CryptoTrackCore } from './CryptoTrack'

export function TaskListCompact() {
  return <div data-compact-app-stack="task-list"><TaskListCore /></div>
}

export function CryptoTrackCompact() {
  return <div data-compact-app-stack="crypto-track"><CryptoTrackCore /></div>
}
