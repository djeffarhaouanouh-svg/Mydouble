import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');

  if (ref) {
    // Poser le cookie affiliate_ref pour 30 jours
    const response = NextResponse.next();
    response.cookies.set('affiliate_ref', ref, {
      maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
      path: '/',
      httpOnly: false, // Accessible côté client pour lire dans le front
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Exclure les fichiers statiques et API du middleware
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
