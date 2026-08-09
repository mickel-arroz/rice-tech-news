import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 14, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'square' as const,
    strokeLinejoin: 'miter' as const,
    'aria-hidden': true,
    ...props,
  };
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M20 14v6H4V4h6" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3.6 3 14.4 0 18c-3-3.6-3-14.4 0-18Z" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="5" width="16" height="16" />
      <path d="M4 10h16" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function PointsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5 20 19H4L12 5Z" />
    </svg>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4h16v12H9l-5 5V4Z" />
    </svg>
  );
}

export function SignalIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 12v9" />
      <path d="M7 8a7 7 0 0 1 10 0" />
      <path d="M4 5a11 11 0 0 1 16 0" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}
