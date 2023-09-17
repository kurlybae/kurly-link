import { Formik } from 'formik';
import React, { useCallback, useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel as OrgFormControlLabel,
  FormHelperText,
  FormLabel,
  Input,
  InputLabel,
  Radio,
  RadioGroup,
  Stack,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { AppCallType, BridgeType, LinkData, LinkFormData } from '@/types';
import { addYears, format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { KEY_REGEX_SOURCE } from '@/shared/constants/key';
import { NEXT_PUBLIC_APP_URI_SCHEME } from '@/shared/configs';
import { getParamsFromUrl, getUrl } from '@/shared/utils/url-helper';
import { FormControlLabelProps } from '@mui/material/FormControlLabel/FormControlLabel';
import { AppCallTypeTitle, BridgeTypeTitle } from '@/shared/constants/titles';

const RadioFormControl = styled(FormControl)`
  display: flex;
  flex-direction: row;
  align-items: center;

  label {
    margin-right: 16px;
  }
`;

const stringFields: (keyof Pick<
  LinkFormData,
  'webUrl' | 'iosUrl' | 'aosUrl'
>)[] = ['webUrl', 'iosUrl', 'aosUrl'];

const fieldTitles: Record<keyof FormData, string> = {
  webUrl: '웹 링크',
  iosUrl: 'IOS 링크',
  aosUrl: '안드로이드 링크',
  bridgeType: '타입',
  bridgeTemplate: '템플릿',
  appCall: '앱 자동호출',
  expireDateString: '만료일(한국시간)',
};
const placeHolders: Partial<Record<keyof FormData, string | undefined>> = {
  webUrl: 'https://',
  iosUrl: NEXT_PUBLIC_APP_URI_SCHEME,
  aosUrl: NEXT_PUBLIC_APP_URI_SCHEME,
};

function getEncodingError(url: string) {
  const first = url.indexOf('?');
  if (first >= 0) {
    const back = url.slice(first + 1);
    const query = back.split('&').find((row) => {
      const sanitized = row.replace('=', '').replace(/[$%]/g, '');
      return encodeURIComponent(sanitized) !== sanitized;
    });
    if (query) {
      return `인코딩 필요 (${query})`;
    }
  }
}

function checkDate(dateString: string) {
  if (Date.now() > new Date(dateString).valueOf()) {
    return '현재 이후의 날짜를 입력하세요';
  }
}

type FormData = Omit<LinkFormData, 'expireDate'> & {
  expireDateString: string;
};

const DEFAULT_INITIAL_VALUE: FormData = {
  webUrl: '',
  iosUrl: '',
  aosUrl: '',
  bridgeType: 'normal',
  bridgeTemplate: null,
  appCall: 'safe_only',
  expireDateString: format(addYears(Date.now(), 1), 'yyyy-MM-dd'),
};

const hashRegex = new RegExp(`#(add|edit)(?:-(${KEY_REGEX_SOURCE}))?$`);

function parsePath(
  asPath: string,
): { type: 'add' | 'edit'; key?: string } | undefined {
  const match = hashRegex.exec(asPath);
  if (match) {
    const type = match[1] as 'add' | 'edit';
    return {
      type,
      key: type === 'edit' ? match[2] : undefined,
    };
  }
}

function FormControlLabel<T>(props: FormControlLabelProps & { value: T }) {
  return <OrgFormControlLabel {...props} />;
}

export default function LinkForm({
  onSubmitComplete,
}: {
  onSubmitComplete: (key: string, isEdit: boolean, webUrl: string) => void;
}) {
  const router = useRouter();
  const command = useMemo(() => parsePath(router.asPath), [router.asPath]);
  const queryClient = useQueryClient();
  const [sample, setSample] = useState<string>();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { data } = useQuery(
    `links/${command?.key}`,
    () =>
      command?.key
        ? axios
            .get<LinkData>(`/api/admin/links/${command.key}`)
            .then((x) => x.data)
        : undefined,
    { refetchOnWindowFocus: false, retry: false },
  );

  const initialValues = useMemo<FormData>(
    () =>
      data
        ? {
            webUrl: data.webUrl,
            iosUrl: data.iosUrl,
            aosUrl: data.aosUrl,
            bridgeType: data.bridgeType,
            bridgeTemplate: data.bridgeTemplate,
            appCall: data.appCall,
            expireDateString: format(data.expireDate, 'yyyy-MM-dd'),
          }
        : DEFAULT_INITIAL_VALUE,
    [data],
  );

  const onClose = useCallback(async () => {
    await router.replace({ hash: undefined });
  }, [router]);

  const onSubmit = useCallback(
    async ({
      expireDateString,
      iosUrl,
      aosUrl,
      bridgeTemplate,
      ...restData
    }: FormData) => {
      const request: LinkFormData = {
        ...restData,
        iosUrl: iosUrl || null,
        aosUrl: aosUrl || null,
        expireDate: parse(expireDateString, 'yyyy-MM-dd', 0, {
          locale: ko,
        }).valueOf(),
        bridgeTemplate:
          restData.bridgeType === 'app_only' ? bridgeTemplate : null,
      };

      if (data) {
        if (
          Object.keys(request).every((x) => {
            const key = x as keyof LinkFormData;
            return request[key] === data[key];
          })
        ) {
          alert('변경사항이 없습니다');
          await onClose();
          return;
        }
        if (
          !confirm('(주의) 기존의 데이터를 덮어씁니다. 정말 수정하시겠습니까?')
        ) {
          return;
        }
      }
      try {
        const result = data
          ? await axios
              .patch<{ key: string }>(`/api/admin/links/${data.key}`, request)
              .then((x) => x.data.key)
          : await axios
              .post<{ key: string }>('/api/admin/links', request)
              .then((x) => x.data.key);
        void queryClient.invalidateQueries('links');
        onSubmitComplete(result, !!data, request.webUrl);
      } catch (e) {
        if (e instanceof AxiosError) {
          if (e.response && e.response.status === 409) {
            alert(
              '중복된 링크가 있습니다. 기존 링크의 만료일을 변경하여 사용해주세요.',
            );
            const key = e.response.data;
            await router.replace({ hash: key });
            return;
          }
        }
        alert(
          `${data ? '수정' : '등록'}에 실패하였습니다\n${(e as Error).message}`,
        );
      }
      onClose();
    },
    [data, onClose, onSubmitComplete, queryClient, router],
  );
  const validate = useCallback(
    ({ webUrl, iosUrl, aosUrl, expireDateString }: FormData) => {
      const error: Partial<FormData> = {};
      if (!webUrl) {
        error.webUrl = '필수 입력';
      } else {
        if (!/^https?:\/\//.test(webUrl)) {
          error.webUrl = '링크 형식을 바르게 입력해주세요';
        } else {
          error.webUrl = getEncodingError(webUrl);
          const { params, numberParams } = getParamsFromUrl(webUrl);
          if (!error.webUrl) {
            if (
              numberParams.length > 0 &&
              Math.max(...numberParams) !== numberParams.length
            ) {
              error.webUrl = 'Path 변수는 순차적으로만 사용 가능합니다';
            }
          }
          [iosUrl, aosUrl].forEach((url, idx) => {
            const key: keyof FormData = idx === 0 ? 'iosUrl' : 'aosUrl';
            if (url) {
              error[key] = getEncodingError(url);
              if (!error[key]) {
                if (
                  !NEXT_PUBLIC_APP_URI_SCHEME ||
                  url.startsWith(NEXT_PUBLIC_APP_URI_SCHEME)
                ) {
                  const currentParams = getParamsFromUrl(url);
                  if (!currentParams.params.every((x) => params.includes(x))) {
                    error[key] =
                      fieldTitles.webUrl +
                      `에 있는 변수(${params
                        .map((x) => `$${x}`)
                        .join(',')})만 사용할 수 있습니다.`;
                  } else if (getEncodingError(url)) {
                    error[key] =
                      '인코딩 되지 않은 쿼리항목이 있습니다. 확인해주세요';
                  }
                } else {
                  error[key] = '링크 형식을 바르게 입력해주세요';
                }
              }
            }
          });
        }
      }

      error.expireDateString = checkDate(expireDateString);
      Object.keys(error).forEach((key) => {
        const typedKey = key as keyof FormData;
        if (!error[typedKey]) {
          delete error[typedKey];
        }
      });

      if (!error.webUrl) {
        if (/\$(\w+)\b/.test(webUrl)) {
          setSample(getUrl('OOOOOOOO', webUrl));
        } else {
          setSample(undefined);
        }
      }

      return error;
    },
    [],
  );

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      open={!!(command && (command.type === 'add' || data))}
      onClose={onClose}
      aria-labelledby="link-form-dialog-title"
    >
      <DialogTitle id="link-form-dialog-title">
        {data?.key || '등록'}
        {sample && (
          <Typography
            fontSize="small"
            fontFamily="monospace"
            sx={{ mb: '-18px' }}
          >
            예상 URL : {sample}
          </Typography>
        )}
      </DialogTitle>

      <Formik<FormData>
        initialValues={initialValues}
        onSubmit={onSubmit}
        validate={validate}
      >
        {({
          values,
          errors,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          /* and other goodies */
        }) => (
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Stack gap={1} pb={2}>
                {stringFields.map((key) => (
                  <FormControl
                    key={key}
                    error={!!errors[key]}
                    variant="standard"
                  >
                    <InputLabel htmlFor={key}>{fieldTitles[key]}</InputLabel>
                    <Input
                      type="text"
                      id={key}
                      name={key}
                      aria-describedby={`component-text-${key}`}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values[key]}
                      placeholder={placeHolders[key]}
                    />
                    {errors[key] && (
                      <FormHelperText id={`component-text-${key}`}>
                        {errors[key]}
                      </FormHelperText>
                    )}
                  </FormControl>
                ))}
                <RadioFormControl>
                  <FormLabel id="bridgeType-label" sx={{ mr: 2 }}>
                    {fieldTitles.bridgeType}
                  </FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="bridgeType-label"
                    name="bridgeType"
                    onChange={handleChange}
                    value={values.bridgeType}
                  >
                    <FormControlLabel<BridgeType>
                      value="normal"
                      control={<Radio />}
                      label={BridgeTypeTitle.normal}
                    />
                    <FormControlLabel<BridgeType>
                      value="app_only"
                      control={<Radio />}
                      label={BridgeTypeTitle.app_only}
                    />
                    <FormControlLabel<BridgeType>
                      value="app_nudge"
                      control={<Radio />}
                      label={BridgeTypeTitle.app_nudge}
                      disabled
                    />
                  </RadioGroup>
                </RadioFormControl>
                <RadioFormControl>
                  <FormLabel id="appCall-label" sx={{ mr: 2 }}>
                    {fieldTitles.appCall}
                  </FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="appCall-label"
                    name="appCall"
                    onChange={handleChange}
                    value={values.appCall}
                  >
                    <FormControlLabel<AppCallType>
                      value="safe_only"
                      control={<Radio />}
                      label={AppCallTypeTitle.safe_only}
                    />
                    <FormControlLabel<AppCallType>
                      value="always"
                      control={<Radio />}
                      label={AppCallTypeTitle.always}
                    />
                    <FormControlLabel<AppCallType>
                      value="none"
                      control={<Radio />}
                      label={AppCallTypeTitle.none}
                    />
                  </RadioGroup>
                </RadioFormControl>
                <FormControl
                  error={!!errors.expireDateString}
                  variant="standard"
                >
                  <InputLabel htmlFor="expireDateString">
                    {fieldTitles.expireDateString}
                  </InputLabel>
                  <Input
                    type="date"
                    id="expireDateString"
                    name="expireDateString"
                    aria-describedby="component-text-expireDateString"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.expireDateString}
                  />
                  {errors.expireDateString && (
                    <FormHelperText id={`component-text-expireDateString`}>
                      {errors.expireDateString}
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button autoFocus onClick={onClose}>
                취소
              </Button>
              <Button type="submit" autoFocus disabled={isSubmitting}>
                {data ? '수정' : '등록'}
              </Button>
            </DialogActions>
          </form>
        )}
      </Formik>
    </Dialog>
  );
}
