import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export const MODELS = [
  { value: 'qwen2.5:3b', label: 'Qwen 2.5 3B' },
  { value: 'qwen2.5:1.5b', label: 'Qwen 2.5 1.5B' },
  { value: 'qwen2.5:0.5b', label: 'Qwen 2.5 0.5B' },
]

export function ModelSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = MODELS.find((m) => m.value === value) || MODELS[0]

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors border border-transparent hover:border-[var(--border)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select model"
      >
        <span className="font-medium">{selected.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute right-0 top-full mt-1 py-1.5 min-w-[180px] bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-lg z-20"
          >
            {MODELS.map((m) => (
              <li key={m.value} role="option" aria-selected={value === m.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(m.value)
                    setOpen(false)
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                >
                  <span>{m.label}</span>
                  {value === m.value && <Check className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
