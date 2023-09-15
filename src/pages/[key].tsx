import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { isKey } from '@/constants/key';
import storage from '@/libs/storage';
import UAParser from 'ua-parser-js';
import { isRobot } from '@/utils/is-robot';
import { useEffect, useMemo } from 'react';
import { isAppWebview } from '@/utils/device';
import { appendQueryString, getAppOpenLink } from '@/utils/app-link';
import Head from 'next/head';

export default function Link({
  linkData,
  destination,
  device: { isMobile, isIOS, isWebview },
  currentHref,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const appLink = useMemo(
    () =>
      linkData
        ? (isIOS ? linkData.iosUrl : linkData.aosUrl) ||
          getAppOpenLink(currentHref)
        : undefined,
    [currentHref, isIOS, linkData],
  );

  const isAppOnly = linkData?.appOnly && appLink;
  useEffect(() => {
    if (!linkData) {
      alert('유효하지 않은 주소입니다.');
      location.replace(destination);
      return;
    }

    if (isMobile) {
      if (appLink) {
        location.replace(appLink);
      }
    }

    if (!isAppOnly) {
      setTimeout(() => {
        location.replace(linkData.webUrl);
      }, 100);
    }
  }, [appLink, destination, isAppOnly, isMobile, isWebview, linkData]);

  return (
    <>
      <Head>
        <title>{isAppOnly ? '앱을 설치해주세요' : '이동중입니다'}</title>
      </Head>
      {isAppOnly && (
        <>
          앱에서만 사용가능
          <br />
          <a href={appLink}>앱으로 이동</a>
        </>
      )}
    </>
  );
}

export const getServerSideProps = async ({
  req,
  query: { key, ...restQuery },
}: GetServerSidePropsContext) => {
  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.ORIGIN;
  const currentHref = origin?.concat(req.url || '') || '';
  const ua = new UAParser(req.headers['user-agent']).getResult();
  const device = {
    isMobile: ua.device.type === 'mobile',
    isIOS: ua.os.name === 'iOS',
    isWebview: isAppWebview(ua.ua),
  };

  const data = isKey(key) ? (await storage.get(key)) ?? null : null;
  if (data) {
    data.webUrl = appendQueryString(data.webUrl, restQuery);
    data.iosUrl = appendQueryString(data.iosUrl, restQuery);
    data.aosUrl = appendQueryString(data.aosUrl, restQuery);
  }

  const destination = data?.webUrl ?? process.env.FALLBACK_URL;
  // 목적지가 없으면 무조건 404
  if (!destination) {
    return { notFound: true };
  }
  if (device.isMobile) {
    if (data && device.isWebview) {
      return {
        redirect: {
          permanent: false,
          destination:
            (device.isIOS ? data.iosUrl : data.aosUrl) || data.webUrl,
        },
      };
    }
  } else {
    // 크롤러 or PC 에 앱전용이 아닌경우, 바로 redirect
    if (isRobot(ua.ua) || (data && !data.appOnly)) {
      return {
        redirect: {
          permanent: false,
          destination,
        },
      };
    }
  }

  return {
    props: {
      linkData: data,
      destination,
      device,
      currentHref,
    },
  };
};
