import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { Role } from '@/@types/next-auth';

const companyEmailRegex = process.env.ADMIN_COMPANY_EMAIL
  ? new RegExp(`@(${process.env.ADMIN_COMPANY_EMAIL.split(',').join('|')})$`)
  : undefined;
const adminUsers = process.env.ADMIN_USERS
  ? process.env.ADMIN_USERS.split(',')
  : [];

function getRole(email?: string) {
  const result: Role[] = [];
  if (!email) {
    return result;
  }
  if (companyEmailRegex?.test(email)) {
    result.push('user');
  }

  if (adminUsers.includes(email)) {
    result.push('admin');
  }

  return result;
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile) {
        return {
          role: getRole(profile.email),
          id: profile.sub,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    signIn: (data) => {
      return data.user.role.includes('user');
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
