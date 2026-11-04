import { useEffect } from 'react'
import { useUiStore, type BoardPick } from '../store/uiStore'

/** Bật chế độ chọn ô trên bàn cờ 3D trong lúc component còn hiển thị. */
export function useBoardPick(pick: BoardPick | null): void {
  const setPick = useUiStore((s) => s.setPick)
  useEffect(() => {
    setPick(pick)
    return () => setPick(null)
  }, [pick, setPick])
}
