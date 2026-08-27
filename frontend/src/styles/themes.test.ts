import { describe, expect, test } from 'bun:test'
import { contrastRatio, voxelTokens } from './tokens'
import { themes } from './themes'

describe('voxel brand tokens', () => {
  test('ember on void meets body-text contrast', () => {
    expect(contrastRatio(voxelTokens.text, voxelTokens.void)).toBeGreaterThan(7)
    expect(contrastRatio(voxelTokens.emberHighlight, voxelTokens.void)).toBeGreaterThan(4.5)
  })

  test('default theme is ember, not cyan', () => {
    const primary = themes.claudeCode.colors.interactive.primary.toLowerCase()
    expect(primary).toBe(voxelTokens.ember.toLowerCase())
    expect(primary.includes('33d7ff')).toBe(false)
    expect(themes.claudeCode.colors.background.primary.toLowerCase()).toBe(voxelTokens.void)
  })
})
