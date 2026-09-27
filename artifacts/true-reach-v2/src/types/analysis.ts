import type { AnalysisResult } from '@workspace/api-client-react';

export type NormalizedAnalysis = AnalysisResult;

export function isSupportedVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (['tiktok.com', 'www.tiktok.com', 'm.tiktok.com'].includes(host)) {
      return /^\/@[\w.-]+\/video\/\d{12,25}\/?$/.test(url.pathname);
    }
    if (['instagram.com', 'www.instagram.com'].includes(host)) {
      return /^\/(reel|p)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
    }
    return false;
  } catch {
    return false;
  }
}

export function formatTime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'Not available';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function analysisError(error: unknown): string {
  if (error && typeof error === 'object') {
    const item = error as { message?: string; status?: number; data?: unknown; response?: { status?: number; data?: unknown } };
    const payload = (item.data ?? item.response?.data) as { message?: string; error?: string } | undefined;
    const detail = payload?.message || payload?.error;
    if (detail) return detail;
    if (item.response?.status === 404 || item.status === 404) return 'This post was not found in the indexed source. Check the URL or try the example post.';
    if (item.response?.status === 422 || item.status === 422) return 'The source could not analyze this post. Check the link and try again.';
    if (item.message && !/^(failed to fetch|network error)$/i.test(item.message)) return item.message;
  }
  return 'The evidence source could not be reached right now. Please try again.';
}
