import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('ic_role')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/brand/') && role !== 'brand') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (pathname.startsWith('/influencer/') && role !== 'influencer') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/brand/:path*', '/influencer/:path*'],
};
