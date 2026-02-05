import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DANURI ITSM - 사용자 포털',
  description: '서비스 요청 등록 및 조회',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
