import { useEffect, useState } from 'react'

/**
 * false ở lần render đầu, true từ lần sau. Thứ gì mount SAU khi cha đã hiện
 * (nhà vừa xây, đất vừa mua) thì chạy animation mọc lên; thứ có sẵn từ đầu thì không.
 */
export function useMountedFlag(): boolean {
  const [mounted, setMounted] = useState(false)
  // Cố ý render lại một lần sau khi mount để đánh dấu "đã có mặt" — chỉ chạy một lần mỗi component.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => setMounted(true), [])
  return mounted
}
