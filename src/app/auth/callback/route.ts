import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // If Supabase returned an error, redirect home (the client will show login)
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(origin);
  }

  // PKCE flow: exchange the code for a session
  if (code) {
    const response = NextResponse.redirect(origin);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.headers
              .get('cookie')
              ?.split('; ')
              .find((c) => c.startsWith(`${name}=`))
              ?.split('=')
              .slice(1)
              .join('=');
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error('Code exchange failed:', exchangeError.message);
    }

    return response;
  }

  // No code param -- redirect home. If there's a token hash fragment (#access_token=...)
  // the client-side Supabase SDK will pick it up automatically.
  return NextResponse.redirect(origin);
}
