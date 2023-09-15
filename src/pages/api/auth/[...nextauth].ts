import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { Role } from '@/@types/next-auth';
import {
  ADMIN_COMPANY_EMAIL,
  ADMIN_USERS,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  KAKAO_CLIENT_ID,
  KAKAO_CLIENT_SECRET,
} from '@/shared/configs';

const companyEmailRegex = ADMIN_COMPANY_EMAIL
  ? new RegExp(`@(${ADMIN_COMPANY_EMAIL.split(',').join('|')})$`)
  : undefined;
const adminUsers = ADMIN_USERS ? ADMIN_USERS.split(',') : [];

function getRole(email?: string) {
  const result: Role[] = [];
  if (!email) {
    return result;
  }
  if (!companyEmailRegex || companyEmailRegex.test(email)) {
    result.push('user');
  }

  if (adminUsers.includes(email)) {
    result.push('admin');
  }

  return result;
}

const providers: AuthOptions['providers'] = [];

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          role: getRole(profile.email),
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  );
}
if (KAKAO_CLIENT_ID && KAKAO_CLIENT_SECRET) {
  providers.push(
    KakaoProvider({
      clientId: KAKAO_CLIENT_ID,
      clientSecret: KAKAO_CLIENT_SECRET,
      profile(profile) {
        const email = profile.kakao_account.email;
        return {
          role: getRole(email),
          id: profile.id,
          name: profile.properties.nickname,
          email,
          image: profile.properties.thumbnail_image,
        };
      },
    }),
  );
}

export const authOptions: AuthOptions = {
  providers,
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
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
