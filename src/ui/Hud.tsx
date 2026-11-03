/** Lớp UI 2D đè lên canvas. pointer-events-none để không chặn thao tác 3D. */
export function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center p-6">
      <h1 className="rounded-2xl bg-white/80 px-5 py-2 text-xl font-bold text-amber-900 shadow-md">
        Bella Monopoly
      </h1>
    </div>
  )
}
