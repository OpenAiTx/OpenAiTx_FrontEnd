import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 獲取當前應用的基礎 URL
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://openaitx.github.io' // 預設值
}

// 獲取當前應用的完整 URL（包含 hash 路由）- 用於 badge 連結
export function getAppUrl() {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/#`
}

// 獲取 GitHub 專案 URL
export function getGitHubUrl() {
  return 'https://github.com/OpenAiTx/OpenAiTx'
}
