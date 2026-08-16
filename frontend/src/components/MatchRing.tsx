type Props = { value: number; size?: number; label?: string };

export function MatchRing({ value, size = 160, label = "Match Score" }: Props) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(value, 0), 100) / 100) * c;

  return (
    <div className="d-inline-flex flex-column align-items-center">
      <div className="position-relative" style={{ width: size, height: size }}>
        <svg className="sr-ring" width={size} height={size}>
          <circle className="sr-ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
          <circle
            className="sr-ring-bar"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div style={{ fontSize: size * 0.24, fontWeight: 600, lineHeight: 1 }}>{value}%</div>
          <div className="sr-muted" style={{ fontSize: ".78rem" }}>{label}</div>
        </div>
      </div>
    </div>
  );
}
