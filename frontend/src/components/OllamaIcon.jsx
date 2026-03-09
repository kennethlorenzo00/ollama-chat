/**
 * Ollama-style icon: face with eye cutouts so eyes show background (evenodd).
 */
export function OllamaIcon({ className = 'w-5 h-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Head circle then two eye circles = eyes become holes */}
      <path d="M12 4a8 8 0 0 1 0 16 8 8 0 0 1 0-16z M9.5 10.5m-1.2 0a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 1 1-2.4 0z M14.5 10.5m-1.2 0a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 1 1-2.4 0z" />
    </svg>
  )
}
