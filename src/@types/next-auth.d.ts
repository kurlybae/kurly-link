import { DefaultSession, JWT, User } from 'next-auth';

type Role = 'user' | 'admin';

interface ExUser {
  role: Role[];
}

declare module 'next-auth' {
  interface User extends ExUser {}

  interface Session {
    user: ExUser & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends ExUser {}
}
