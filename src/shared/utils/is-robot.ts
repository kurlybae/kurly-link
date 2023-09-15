// isbot 라이브러리 사용하려 하였으나, 컬리 useragent가 bot으로 판단되는 이슈 발생.
// 확인된 케이스만 봇으로 취급

//   'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', // 슬랙
//   'facebookexternalhit/1.1; kakaotalk-scrap/1.0; +https://devtalk.kakao.com/t/scrap/33984', // 카톡
//   'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', // 인스타그램
//   'facebookexternalhit/1.1;line-poker/1.0', // 라인
//   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0', // 애플
//   'Vercel Edge Functions' // vercel app

const BOT_LIST = [
  /Slackbot/,
  /facebookexternalhit/,
  /Facebot/,
  /Twitterbot/,
  /^Vercel Edge Functions$/,
];

export function isRobot(useragent: string): boolean {
  return BOT_LIST.some((x) => x.test(useragent));
}
