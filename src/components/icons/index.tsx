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

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg
      {...base({
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...props,
      })}
    >
      <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
      <path d="M11 13l9 -9" />
      <path d="M15 4h5v5" />
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

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.5 1.3a12 12 0 0 0-6.3 0C6.5 2.8 5.5 3.1 5.5 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
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
