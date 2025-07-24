import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const basicAuth = request.headers.get('authorization');
  const USER = 'dev';
  const PASS = 'devpass';

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pass] = atob(authValue).split(':');
    if (user === USER && pass === PASS) {
      return NextResponse.next();
    }
  }
  return new NextResponse('認証が必要です', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
} 