import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Créer une réponse qui efface tous les cookies et redirige vers login
    const response = NextResponse?.redirect(new URL('/login', req.url))

    // Effacer les cookies
    response?.cookies?.delete('accessToken')
    response?.cookies?.delete('refreshToken')

    // Retourner avec un script pour effacer le localStorage
    return new Response(
      `
      <html>
        <head>
          <title>Déconnexion...</title>
        </head>
        <body>
          <script>
            // Effacer tout le stockage local
            localStorage?.clear();
            sessionStorage?.clear();
            
            // Effacer les cookies côté client
            // biome-ignore lint/security/noDocumentCookie: Cookie enumeration for logout cleanup
            document?.cookie?.split(";").forEach(function(c) { 
              // biome-ignore lint/security/noDocumentCookie: Cookie expiration for logout cleanup
              document.cookie = c?.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Rediriger vers la page de login
            window.location.href = '/login';
          </script>
          <p>Déconnexion en cours...</p>
        </body>
      </html>
    `,
      {
        headers: {
          'Content-Type': 'text/html',
          'Set-Cookie': [
            'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
            'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          ].join(', '),
        },
      }
    )
  } catch (_error) {
    return NextResponse?.json({ error: 'Logout failed' }, { status: 500 })
  }
}
