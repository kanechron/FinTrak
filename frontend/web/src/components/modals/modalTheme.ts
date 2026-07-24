// Shared styling for all Add/Edit modals so they follow the same design tokens
// and toggle-switch/chip patterns instead of each modal re-implementing its own.

// Below sm: the card docks to the bottom of the screen as a full-width sheet
// (rounded top corners only, no side/bottom margin). At sm: and up it's the
// original centered dialog.
export const overlayClass =
  'fixed inset-0 h-dvh bg-black/60 z-50 flex items-end sm:items-center justify-center cursor-pointer'

export function cardClass(maxWidth: 'max-w-md' | 'max-w-xl' = 'max-w-md') {
  return `bg-card border border-line rounded-t-2xl sm:rounded-xl p-6 w-full ${maxWidth} max-h-[85vh] sm:max-h-none overflow-y-auto flex flex-col gap-4 cursor-default`
}

export const titleClass = 'text-lg font-semibold text-ink'
export const labelClass = 'text-xs text-ink-3'
export const errorClass = 'text-bad text-xs'

export const inputClass =
  'w-full p-2 bg-raised border border-line rounded-lg text-sm text-ink-2 placeholder-ink-3 focus:outline-none focus:border-line-2'

export const primaryButtonClass =
  'w-full bg-s1 hover:opacity-90 text-white text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'

export const checkboxClass = 'accent-s1 w-4 h-4 cursor-pointer'

export function chipClass(active: boolean) {
  return `py-1 px-2.5 text-sm rounded-lg transition-colors cursor-pointer ${
    active ? 'bg-s1 text-white' : 'bg-raised text-ink-2 hover:bg-line-2'
  }`
}

export function toggleTrackClass(active: boolean) {
  return `w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
    active ? 'bg-good' : 'bg-raised'
  }`
}

export function toggleThumbClass(active: boolean) {
  return `absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
    active ? 'translate-x-4' : 'translate-x-0.5'
  }`
}
