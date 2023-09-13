import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    if (pathname === '/') {
      return NextResponse.redirect(process.env.HOME_URL || '');
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
