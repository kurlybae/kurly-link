import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { isKey } from '@/shared/constants/key';
import storage from '@/shared/libs/storage';
import UAParser from 'ua-parser-js';
import { isRobot } from '@/shared/utils/is-robot';
import { useEffect, useMemo } from 'react';
import { isAppWebview, isUriSchemeSafeBrowser } from '@/shared/utils/device';
import Head from 'next/head';
import { getAppOpenLink, setLink } from '@/shared/utils/url-helper';
import { FALLBACK_URL, ORIGIN } from '@/shared/configs';
import InvalidInputError from '@/shared/libs/errors/InvalidInputError';
import { AppCallType } from '@/types';

export function shouldCallAppOnload(
  appCallType: AppCallType,
  isSafeBrowser: boolean,
): boolean {
  if (appCallType === 'always') {
    return true;
  } else if (appCallType === 'safe_only') {
    return isSafeBrowser;
  }

  return false;
}

export default function Link({
  linkData,
  message,
  fallbackUrl,
  device: { isMobile, isIOS, isSafeBrowser },
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

  const isAppOnly = linkData?.bridgeType === 'app_only' && appLink;
  useEffect(() => {
    if (!linkData) {
      alert(message);
      if (fallbackUrl) {
        location.replace(fallbackUrl);
      }
      return;
    }

    if (isMobile) {
      if (appLink && shouldCallAppOnload(linkData.appCall, isSafeBrowser)) {
        location.replace(appLink);
      }
    }

    if (!isAppOnly) {
      setTimeout(() => {
        location.replace(linkData.webUrl);
      }, 100);
    }
  }, [
    appLink,
    fallbackUrl,
    isAppOnly,
    isMobile,
    isSafeBrowser,
    linkData,
    message,
  ]);

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
    isSafeBrowser: isUriSchemeSafeBrowser(ua),
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
      if (isRobot(ua.ua) || data.bridgeType === 'normal') {
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
