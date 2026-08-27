import { describe, expect, test } from 'bun:test'
import { BOOT_POSTER, BOOT_VIDEO, prefersReducedMotion } from './brandMedia'

describe('brand media', () => {
  test('boot assets point at the voxel preloader', () => {
    expect(BOOT_VIDEO).toBe('/media/landing/cldcde-preloader.mp4')
    expect(BOOT_POSTER).toBe('/media/landing/cldcde-preloader-poster.jpg')
  })

  test('reduced motion is false when matchMedia is missing', () => {
    expect(prefersReducedMotion()).toBe(false)
  })
})
