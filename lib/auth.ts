// lib/auth.ts
// NextAuth v5 Configuration with Security Best Practices

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './prisma';
import type { UserRole } from '@prisma/client';

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Extend session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: UserRole;
      locale: string;
    };
  }
  
  interface User {
    role: UserRole;
    locale: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    locale: string;
  }
}

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    
    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    
    // Email/Password
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      
      async authorize(credentials) {
        // Validate input
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error('Invalid credentials format');
        }
        
        const { email, password } = parsed.data;
        
        // Find user
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            role: true,
            locale: true,
            failedAttempts: true,
            lockedUntil: true,
            emailVerified: true,
          },
        });
        
        if (!user) {
          throw new Error('Invalid email or password');
        }
        
        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMs = user.lockedUntil.getTime() - Date.now();
          const remainingMins = Math.ceil(remainingMs / 60000);
          throw new Error(`Account locked. Try again in ${remainingMins} minutes`);
        }
        
        // Verify password
        if (!user.passwordHash) {
          throw new Error('Please sign in with Google');
        }
        
        const isValidPassword = await compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          // Increment failed attempts
          const newAttempts = user.failedAttempts + 1;
          const updates: { failedAttempts: number; lockedUntil?: Date } = {
            failedAttempts: newAttempts,
          };
          
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: updates,
          });
          
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            throw new Error('Too many failed attempts. Account locked for 15 minutes');
          }
          
          throw new Error('Invalid email or password');
        }
        
        // Check email verification
        if (!user.emailVerified) {
          throw new Error('Please verify your email first');
        }
        
        // Reset failed attempts on success
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          locale: user.locale,
        };
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, ensure user has necessary fields
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        
        if (!existingUser) {
          // Create new user with default role
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
              role: 'CUSTOMER',
              locale: 'bn',
            },
          });
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.locale = user.locale;
      }
      
      // Handle session updates
      if (trigger === 'update' && session) {
        if (session.locale) token.locale = session.locale;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.locale = token.locale;
      }
      
      return session;
    },
  },
  
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Create cart for new user
        await prisma.cart.create({
          data: { userId: user.id! },
        });
        
        // Create tracker settings
        await prisma.trackerSettings.create({
          data: { userId: user.id! },
        });
      }
    },
  },
  
  // Security settings
  trustHost: true,
  
  cookies: {
    sessionToken: {
      name: `__Secure-authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `__Host-authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});

// Helper functions
export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden');
  }
  return session;
}
