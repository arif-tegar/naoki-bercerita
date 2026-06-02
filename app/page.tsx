import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Jika pengguna membuka halaman utama (/), langsung lempar ke /register
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/register', request.url));
  }
  return NextResponse.next();
}

// Tentukan rute mana saja yang akan diproses oleh middleware ini
export const config = {
  matcher: '/',
};