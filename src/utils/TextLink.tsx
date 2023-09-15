import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react';

export default function TextLink({
  children,
  ...props
}: DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>) {
  if (typeof children === 'string' && !props.href) {
    if (/^(https?:\/)?\//.test(children)) {
      return (
        <a {...props} href={children}>
          {children}
        </a>
      );
    } else if (/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(children)) {
      return (
        <a {...props} href={`mailto:${children}`}>
          {children}
        </a>
      );
    }
  } else {
    return <a {...props}>{children}</a>;
  }

  return <span {...props}>{children}</span>;
}
