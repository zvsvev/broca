export function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        className="logo-body"
        d="M5 3h22a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H12l-8 6V6a3 3 0 0 1 1-3z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle className="logo-eye" cx="12" cy="13.5" r="2.2" />
      <circle className="logo-eye" cx="20" cy="13.5" r="2.2" />
    </svg>
  );
}
