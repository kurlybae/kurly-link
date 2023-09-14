import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { KEY_LENGTH } from '@/constants/key';
import storage from '@/libs/storage';
import isbot from 'isbot';
import { LinkData } from '@/types';

export default function Link({
  linkData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <>{JSON.stringify(linkData)}</>;
}
export const getServerSideProps: GetServerSideProps<{
  linkData: LinkData;
}> = async ({ req, query }) => {
  const key = query.key;
  if (typeof key === 'string' && key.length === KEY_LENGTH) {
    const data = await storage.get(key);
    if (data) {
      if (isbot(req.headers['user-agent'])) {
        return {
          redirect: {
            permanent: false,
            destination: data.webUrl,
          },
        };
      } else {
        return {
          props: { linkData: data },
        };
      }
    }
  }
  return { notFound: true };
};
