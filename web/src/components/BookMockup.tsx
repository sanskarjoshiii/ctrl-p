import type { CSSProperties, ReactNode } from 'react';
import './BookMockup.css';

interface Props {
  /** Cover image URL, or custom cover content. */
  src?: string;
  children?: ReactNode;
  spineColor?: string;
  width?: number | string;
  tilt?: number;
  className?: string;
  alt?: string;
  style?: CSSProperties;
}

/** A 3D hardcover book built with CSS transforms. */
export function BookMockup({ src, children, spineColor = '#e9e1cf', width = 260, tilt = -26, className = '', alt = '', style }: Props) {
  return (
    <div className={`book ${className}`} style={{ '--book-w': typeof width === 'number' ? `${width}px` : width, '--tilt': `${tilt}deg`, '--spine': spineColor, ...style } as CSSProperties}>
      <div className="book__body">
        <div className="book__cover">
          {src ? <img src={src} alt={alt} loading="lazy" draggable={false} /> : children}
          <span className="book__gloss" />
        </div>
        <div className="book__spine" />
        <div className="book__pages" />
        <div className="book__back" />
      </div>
      <div className="book__shadow" />
    </div>
  );
}
