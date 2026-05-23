import type { ComponentChildren } from 'preact';
import { ThemeToggle } from './ThemeToggle.tsx';

export function Layout({ children }: { children?: ComponentChildren }) {
  return (
    <>
      {children}
      <ThemeToggle />
    </>
  );
}
