import { AuthProvider } from '@/lib/AuthContext';
import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Lunch App',
  description: 'Organize your lunch preferences and dietary needs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
