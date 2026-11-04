import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from './uiStore'
import { getUserView, resetUserView, setUserView } from './viewControl'

const limits = { maxZoom: 3, maxPan: 6 }

describe('Zoom / kéo bàn cờ', () => {
  beforeEach(() => resetUserView())

  it('giới hạn zoom trong [1, maxZoom]', () => {
    setUserView(10, 0, 0, limits)
    expect(getUserView().zoom).toBe(3)
    setUserView(0.2, 0, 0, limits)
    expect(getUserView().zoom).toBe(1)
  })

  it('chưa zoom thì không kéo được; zoom càng lớn kéo càng xa', () => {
    setUserView(1, 5, 5, limits)
    expect(getUserView().panRight).toBe(0)
    setUserView(2, 100, 0, limits)
    expect(getUserView().panRight).toBeCloseTo(3)
    setUserView(3, 100, 0, limits)
    expect(getUserView().panRight).toBeCloseTo(4)
  })

  it('báo cho UI hiện nút Toàn cảnh, bấm thì về như cũ', () => {
    setUserView(2, 1, 0, limits)
    expect(useUiStore.getState().viewZoomed).toBe(true)
    resetUserView()
    expect(useUiStore.getState().viewZoomed).toBe(false)
    expect(getUserView()).toMatchObject({ zoom: 1, panRight: 0, panUp: 0 })
  })
})
