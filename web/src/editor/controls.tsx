import { useId, type ReactNode } from 'react';

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="ed-section">
      <header className="ed-section__head">
        <h3>{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Swatches({ value, colors, onChange, allowTransparent = false, label }: { value: string | null; colors: string[]; onChange: (c: string) => void; allowTransparent?: boolean; label: string }) {
  const unique = [...new Set(colors.map(c => c.toUpperCase()))];
  const current = (value ?? '').toUpperCase();
  const custom = Boolean(value) && !unique.includes(current) && value !== 'transparent';
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {allowTransparent && (
        <button type="button" role="radio" aria-checked={value === 'transparent'} className="swatch swatch--none" title="None" onClick={() => onChange('transparent')} />
      )}
      {unique.map(c => (
        <button type="button" role="radio" aria-checked={current === c} key={c} className="swatch" style={{ background: c }} title={c} onClick={() => onChange(c)} />
      ))}
      <label className={`swatch swatch--custom ${custom ? 'is-on' : ''}`} title="Custom colour" style={custom ? { background: value ?? undefined } : undefined}>
        <input type="color" value={value?.startsWith('#') && value.length === 7 ? value : '#000000'} onChange={e => onChange(e.target.value.toUpperCase())} aria-label={`${label}: custom colour`} />
      </label>
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format = v => String(v) }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  const id = useId();
  return (
    <div className="ed-slider">
      <label htmlFor={id}><span>{label}</span><output>{format(value)}</output></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} title={o.title} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function IconButton({ label, onClick, children, disabled, active, className = '' }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean; active?: boolean; className?: string }) {
  return (
    <button type="button" className={`icon-btn ${active ? 'is-active' : ''} ${className}`} aria-label={label} title={label} onClick={onClick} disabled={disabled} aria-pressed={active}>
      {children}
    </button>
  );
}
