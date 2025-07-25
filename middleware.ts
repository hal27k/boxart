import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // 認証チェックを無効化
  return NextResponse.next()

  // --- 以下はBasic認証の元のコードです（将来復活させたいときのためにコメントアウト） ---
  /*
  const basicAuth = req.headers.get('authorization')
  const url = req.nextUrl

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = Buffer.from(authValue, 'base64').toString().split(':')

    if (user === 'youruser' && pwd === 'yourpass') {
      return NextResponse.next()
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-authenticate': 'Basic realm="Secure Area"',
    },
  })
  */
}

export const config = {
  matcher: ['/', '/(.*)'],
}
