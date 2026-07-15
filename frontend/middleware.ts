import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('ic_role')?.value;
  const { pathname } = request.nextUrl;

  // Creator profiles are a public, shareable link (an influencer previewing
  // their own "Open public link", or an outside brand contact with no
  // account at all) — don't force a brand session to view one.
  if (pathname.startsWith('/brand/creator/')) {
    return NextResponse.next();
  }

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
