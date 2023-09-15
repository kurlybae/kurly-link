import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { isKey } from '@/shared/constants/key';
import storage from '@/shared/libs/storage';
import UAParser from 'ua-parser-js';
import { isRobot } from '@/shared/utils/is-robot';
import { useEffect, useMemo } from 'react';
import { isAppWebview } from '@/shared/utils/device';
import { getAppOpenLink } from '@/shared/utils/app-link';
import Head from 'next/head';
import { setLink } from '@/shared/utils/query-helper';
import { FALLBACK_URL, ORIGIN } from '@/shared/configs';
import InvalidInputError from '@/shared/libs/errors/InvalidInputError';

export default function Link({
  linkData,
  message,
  fallbackUrl,
  device: { isMobile, isIOS },
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
      alert(message);
      location.replace(fallbackUrl);
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
  }, [appLink, fallbackUrl, isAppOnly, isMobile, linkData, message]);

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
  const currentHref = ORIGIN?.concat(req.url || '') || '';
  const ua = new UAParser(req.headers['user-agent']).getResult();
  const device = {
    isMobile: ua.device.type === 'mobile',
    isIOS: ua.os.name === 'iOS',
    isWebview: isAppWebview(ua.ua),
  };
  try {
    const data = isKey(key) ? (await storage.get(key)) ?? null : null;
    if (!data) {
      throw new InvalidInputError();
    }

    data.webUrl = setLink(data.webUrl, restQuery);
    data.iosUrl = setLink(data.iosUrl, restQuery);
    data.aosUrl = setLink(data.aosUrl, restQuery);

    if (device.isMobile) {
      if (device.isWebview) {
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
            destination: data.webUrl,
          },
        };
      }
    }

    return {
      props: {
        linkData: data,
        device,
        currentHref,
      },
    };
  } catch (e) {
    // 크롤러는 바로 fallback redirect
    if (!device.isMobile && isRobot(ua.ua)) {
      return {
        redirect: {
          permanent: false,
          destination: FALLBACK_URL,
        },
      };
    }
    return {
      props: {
        linkData: null,
        message:
          e instanceof InvalidInputError
            ? '유효하지 않은 주소입니다.'
            : '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        fallbackUrl: FALLBACK_URL,
        device,
        currentHref,
      },
    };
  }
};
