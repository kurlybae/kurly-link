import Head from 'next/head';
import Setting from '@/components/Setting';
import { SessionProvider } from 'next-auth/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import AppBar from '@/components/AppBar';

const theme = createTheme();

const queryClient = new QueryClient();

export default function Admin() {
  return (
    <ThemeProvider theme={theme}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <Head>
            <title>링크 설정</title>
          </Head>
          <AppBar title="링크 설정" />
          <Setting />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
