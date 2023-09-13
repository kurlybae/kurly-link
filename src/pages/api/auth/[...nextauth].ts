import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const companyEmailRegex = process.env.ADMIN_COMPANY_EMAIL
  ? new RegExp(process.env.ADMIN_COMPANY_EMAIL + '$')
  : undefined;

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    signIn: (data) => {
      return companyEmailRegex
        ? companyEmailRegex.test(data.profile?.email || '')
        : true;
    },
  },
};

export default NextAuth(authOptions);
