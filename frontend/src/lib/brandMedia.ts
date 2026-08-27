export const BOOT_VIDEO = '/media/landing/cldcde-preloader.mp4'
export const BOOT_VIDEO_WEBM = '/media/landing/cldcde-preloader.webm'
export const BOOT_POSTER = '/media/landing/cldcde-preloader-poster.jpg'
export const GHOST_MARK = '/media/branding/ghost-mark.png'
export const OG_IMAGE = '/media/landing/cldcde-preloader-poster.jpg'

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
