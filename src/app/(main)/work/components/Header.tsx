'use client';

import MainHeader from '../../components/Header';

export default function Header({ children }: { children?: React.ReactNode }) {
  return <MainHeader>{children}</MainHeader>;
}
