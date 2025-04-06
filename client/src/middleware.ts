import { NextResponse } from 'next/server';
import { auth } from './auth';

export const middleware = async (request: {
  nextUrl: { pathname: any };
  url: string | URL | undefined;
}) => {
  const session = await auth();
  console.log(session);
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/dashboard')) {
    if (!session || !session.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/login') && session && session.user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/register') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
};

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/'],
};
