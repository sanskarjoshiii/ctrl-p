import { useEffect, useRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import { MotionLines, Smiley, Sparkle } from './Doodles';

type ButtonVariant = 'sky' | 'yellow' | 'ink' | 'pink' | 'white' | 'ghost';
interface ButtonBase {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  lines?: boolean;
  className?: string;
  children: ReactNode;
}

const btnClass = ({ variant = 'sky', size = 'md', block, className }: Omit<ButtonBase, 'children'>) =>
  ['btn', variant !== 'sky' && `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', className].filter(Boolean).join(' ');

export function Button({ variant, size, block, lines, className, children, ...rest }: ButtonBase & ComponentProps<'button'>) {
  return (
    <button className={btnClass({ variant, size, block, className })} {...rest}>
      {children}
      {lines && <MotionLines className="btn__lines" />}
    </button>
  );
}

export function LinkButton({ variant, size, block, lines, className, children, ...rest }: ButtonBase & ComponentProps<typeof Link>) {
  return (
    <Link className={btnClass({ variant, size, block, className })} {...rest}>
      {children}
      {lines && <MotionLines className="btn__lines" />}
    </Link>
  );
}

/** White panel drawn with overshooting marker lines. */
export function SketchFrame({ children, className = '', style, shadow = true }: { children: ReactNode; className?: string; style?: CSSProperties; shadow?: boolean }) {
  return (
    <div className={`frame ${className}`} style={style}>
      {shadow && (
        <>
          <span className="frame__line frame__line--shadow frame__line--b" />
          <span className="frame__line frame__line--shadow frame__line--l" />
        </>
      )}
      <span className="frame__line frame__line--t" />
      <span className="frame__line frame__line--b" />
      <span className="frame__line frame__line--l" />
      <span className="frame__line frame__line--r" />
      {children}
    </div>
  );
}

/** Box with design-tool selection handles on the corners. */
export function Selectable({ children, className = '', style, as: Tag = 'div' }: { children: ReactNode; className?: string; style?: CSSProperties; as?: 'div' | 'nav' }) {
  return (
    <Tag className={`selectable ${className}`} style={style}>
      <span className="selectable__h" />
      <span className="selectable__h" />
      <span className="selectable__h" />
      <span className="selectable__h" />
      {children}
    </Tag>
  );
}

export const Logo = ({ className = '' }: { className?: string }) => (
  <Link to="/" className={`logo ${className}`} aria-label="Book Diaries home">
    <Sparkle className="logo__mark" />
    <span>book diaries</span>
  </Link>
);

export function DoodleHeading({ children, as: Tag = 'h2', className = '' }: { children: ReactNode; as?: 'h1' | 'h2'; className?: string }) {
  return (
    <Tag className={`doodle-heading ${className}`}>
      <span>{children}</span>
      <Smiley />
    </Tag>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const group = (hidden: boolean) => (
    <div className="marquee__group" aria-hidden={hidden || undefined}>
      {items.map(item => (
        <span key={item} style={{ display: 'contents' }}>
          <span className="marquee__item">{item}</span>
          <Sparkle className="marquee__star" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee">
      <div className="marquee__track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}

/** Adds `.is-in` to `.reveal` children once they scroll into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);
  return ref;
}
