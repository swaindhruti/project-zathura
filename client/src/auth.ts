import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        let user = null;

        const { email, password } = credentials || { email: '', password: '' };
        async function login(email: string, password: string) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
              throw new Error(`Login failed: ${res.status}`);
            }

            const data = await res.json();

            if (data.status !== 'success' || !data.data?.user) {
              console.error('API response missing user data:', data);
              return null;
            }

            return {
              ...data.data.user,
              accessToken: data.token,
            };
          } catch (e) {
            console.error('Error logging in:', e);
            return null;
          }
        }

        user = await login(email as string, password as string);
        console.log('User:', user);
        if (!user) {
          console.error('Authentication failed: No user returned from login');
          throw new Error('Invalid credentials.');
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: { id?: string; accessToken?: string; username?: string };
    }) {
      if (user) {
        token.accessToken = user?.accessToken;
        token.id = user.id;
        token.username = user.username;
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.id ?? '';
      session.user.username = token.username ?? '';

      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      username?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    id?: string;
    username?: string;
  }
}
