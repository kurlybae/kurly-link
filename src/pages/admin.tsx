import Head from 'next/head';
import Setting from '@/components/Setting';
import { signOut } from 'next-auth/react';

export default function Admin() {
  return (
    <>
      <Head>
        <title>링크 설정</title>
      </Head>
      <h1>링크 설정하기</h1>
      <button onClick={() => signOut()}>로그아웃</button>
      <Setting />
    </>
  );
}
