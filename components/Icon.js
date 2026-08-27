// 絵文字の代わりに使う、統一感のある単色線画アイコン。
// 外部ライブラリを追加せず、そのまま埋め込めるSVGパスのみで構成。
const common = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const PATHS = {
  headphones: (
    <>
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <rect x="2.5" y="14" width="4" height="7" rx="1.5" />
      <rect x="17.5" y="14" width="4" height="7" rx="1.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 0 4 23.5" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 1 2.5 2.5" />
      <path d="M4 5.5v14" />
      <path d="M20 5.5v14" />
    </>
  ),
  pencil: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  hand: (
    <>
      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 12V4a1.5 1.5 0 0 1 3 0v8" />
      <path d="M14 12V5.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M17 8a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L4 12.4a1.5 1.5 0 0 1 2.4-1.8L8 13" />
    </>
  ),
};

export default function Icon({ name, size = 22, style }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      {...common}
      width={size}
      height={size}
      style={{ verticalAlign: "-4px", display: "inline-block", ...style }}
    >
      {path}
    </svg>
  );
}
