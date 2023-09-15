import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { KEY_REGEX_SOURCE } from '@/shared/constants/key';
import { FALLBACK_URL } from '@/shared/configs';

export default withAuth(
  function middleware(req) {
    const { nextUrl } = req;
    const { pathname } = nextUrl;
    if (pathname === '/') {
      return NextResponse.redirect(FALLBACK_URL);
    }
    const keyMatch = new RegExp(`(^\/${KEY_REGEX_SOURCE})\/(.+)`).exec(
      pathname,
    );
    if (keyMatch) {
      nextUrl.pathname = keyMatch[1];
      nextUrl.searchParams.set('__orgPath', keyMatch[2]);
      return NextResponse.rewrite(nextUrl);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (/\/(api\/)?admin/.test(pathname)) {
          return !!token;
        }
        return true;
      },
    },
  },
);

// export const config = { matcher: ['/admin', '/api/admin'] };
