import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'eStore — منصة التجارة الإلكترونية الفاخرة | estore.eshamikh.com',
  description: 'متجر الشامخ الفاخر للتجارة الإلكترونية ومنصة إدارة المبيعات للشركات والتجار | estore.eshamikh.com',
  icons: {
    icon: '/assets/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
