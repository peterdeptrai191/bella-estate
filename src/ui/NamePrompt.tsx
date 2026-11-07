/** Bảng đặt tên lần đầu vào game (hồ sơ chưa có tên riêng). Tên dùng cho cả chơi với bot và online. */
import { useState } from 'react'
import { META, skinById } from '../config/skins'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import { Modal } from './kit'

export function NamePrompt() {
  const named = useProfileStore((s) => s.named)
  const skin = useProfileStore((s) => s.skin)
  const setName = useProfileStore((s) => s.setName)
  const [value, setValue] = useState('')
  if (named) return null
  const name = value.trim()
  const submit = () => {
    if (name) setName(name)
  }
  const random = () => {
    const list = META.nameSuggestions
    setValue(list[Math.floor(Math.random() * list.length)])
  }
  return (
    <Modal title="Chào mừng tới Bella Estate!" className="w-[28rem]" layer="z-40">
      <div className="flex flex-col items-center gap-[0.8rem]">
        <img src={skinById(skin).avatar} alt="" className="h-[5.5rem] w-[5.5rem] rounded-2xl bg-gradient-to-b from-sky-200 to-sky-100 shadow" />
        <label htmlFor="first-name" className="text-[1.15rem] font-extrabold text-ink">
          Bạn muốn được gọi là gì?
        </label>
        <div className="flex w-full gap-[0.5rem]">
          <input
            id="first-name"
            autoFocus
            maxLength={META.maxNameLength}
            value={value}
            placeholder="Nhập tên của bạn"
            onChange={(e) => setValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            className="min-w-0 flex-1 rounded-xl border-[0.15rem] border-sky-300 bg-white px-[0.8rem] py-[0.45rem] text-[1.25rem] font-extrabold text-ink outline-none placeholder:font-semibold placeholder:text-stone-300 focus:border-sky-500"
          />
          <button
            className="btn-3d btn-yellow flex w-[3rem] items-center justify-center text-[1.4rem]"
            onClick={random}
            title="Tên ngẫu nhiên"
            aria-label="Tên ngẫu nhiên"
          >
            🎲
          </button>
        </div>
        <div className="text-[0.95rem] text-stone-500">
          Tối đa {META.maxNameLength} ký tự · đổi lại được bất cứ lúc nào ở góc trên trang chủ
        </div>
        <button className="btn-3d btn-green w-full py-[0.55rem] text-[1.35rem]" disabled={!name} onClick={submit}>
          Vào chơi
        </button>
        <button
          className="text-[1rem] font-extrabold text-sky-600 underline-offset-2 hover:underline"
          onClick={() => useAuthStore.getState().setOpen(true)}
        >
          Đã có tài khoản? Đăng nhập
        </button>
      </div>
    </Modal>
  )
}
