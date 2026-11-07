/** Đăng nhập / tạo tài khoản (tên đăng nhập + mật khẩu). Đăng nhập rồi thì vào lại ván từ máy nào cũng được. */
import { useState } from 'react'
import { AUTH } from '../net/protocol'
import { useAuthStore } from '../store/authStore'
import { displayName, useProfileStore } from '../store/profileStore'
import { Modal } from './kit'

const input =
  'w-full rounded-xl border-[0.15rem] border-sky-200 bg-white px-[0.8rem] py-[0.4rem] text-[1.15rem] font-bold text-ink outline-none placeholder:font-semibold placeholder:text-stone-300 focus:border-sky-500'

export function AccountModal() {
  const { open, setOpen, busy, error, login, register } = useAuthStore()
  const profileName = useProfileStore((s) => s.name)
  const named = useProfileStore((s) => s.named)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  if (!open) return null
  const submit = () => {
    if (busy) return
    if (tab === 'login') void login(username, password)
    else void register(username, password, name.trim() || (named ? displayName(profileName) : username))
  }
  const ready = username.trim().length >= AUTH.usernameMin && password.length >= AUTH.passwordMin
  return (
    <Modal title="Tài khoản" onClose={() => setOpen(false)} onBackdrop={() => setOpen(false)} className="w-[26rem]" layer="z-50">
      <div className="mb-[0.8rem] flex justify-center gap-[0.4rem]">
        {(
          [
            ['login', 'Đăng nhập'],
            ['register', 'Tạo tài khoản'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-[1rem] py-[0.2rem] text-[1.05rem] font-extrabold ${tab === id ? 'bg-sky-500 text-white shadow' : 'bg-stone-100 text-stone-500'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <form
        className="flex flex-col gap-[0.6rem]"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          id="account-username"
          className={input}
          autoComplete="username"
          autoCapitalize="none"
          placeholder="Tên đăng nhập"
          maxLength={AUTH.usernameMax}
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value.replace(/\s/g, ''))}
        />
        <input
          id="account-password"
          className={input}
          type="password"
          autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        {tab === 'register' && (
          <input
            id="account-name"
            className={input}
            placeholder={`Tên trong game${named ? ` (${displayName(profileName)})` : ''}`}
            maxLength={AUTH.nameMax}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
        )}
        {tab === 'register' && (
          <p className="text-[0.9rem] text-stone-500">
            Tên đăng nhập {AUTH.usernameMin}–{AUTH.usernameMax} ký tự (chữ không dấu, số, dấu _), mật khẩu từ {AUTH.passwordMin} ký tự.
          </p>
        )}
        {error && <p className="text-center text-[1rem] font-bold text-rose-500">{error}</p>}
        <button type="submit" className="btn-3d btn-green py-[0.5rem] text-[1.25rem]" disabled={busy || !ready}>
          {busy ? 'Đang xử lý…' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
        <p className="text-center text-[0.9rem] text-stone-400">Đăng nhập để vào lại ván đang chơi từ máy khác.</p>
      </form>
    </Modal>
  )
}
