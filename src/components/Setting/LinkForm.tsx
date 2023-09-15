import { Formik } from 'formik';
import React, { useCallback, useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  Input,
  InputLabel,
  Modal,
  Paper,
  Stack,
  styled,
  Switch,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { LinkData, LinkFormData } from '@/types';
import { addYears, format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { KEY_REGEX_SOURCE } from '@/shared/constants/key';
import { uniq } from '@/shared/utils';
import { NEXT_PUBLIC_APP_URI_SCHEME } from '@/shared/configs';
import { getParamsFromUrl, getUrl } from '@/shared/utils/url-helper';

const ModalBox = styled(Paper)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  padding: 10px;
`;

const stringFields: (keyof Pick<
  LinkFormData,
  'webUrl' | 'iosUrl' | 'aosUrl'
>)[] = ['webUrl', 'iosUrl', 'aosUrl'];

const fieldTitles: Record<keyof FormData, string> = {
  webUrl: '웹 링크',
  iosUrl: 'IOS 링크',
  aosUrl: '안드로이드 링크',
  appOnly: '앱 전용',
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
  appOnly: false,
  expireDateString: format(addYears(Date.now(), 1), 'yyyy-MM-dd'),
};

const hashRegex = new RegExp(`#(add|edit)(?:-(${KEY_REGEX_SOURCE}))?$`);

function parsePath(
  asPath: string,
): { type: 'add' | 'edit'; key?: string } | undefined {
  const match = hashRegex.exec(asPath);
  if (match) {
    return {
      type: match[1] as 'add' | 'edit',
      key: match[2],
    };
  }
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
            appOnly: data.appOnly,
            expireDateString: format(data.expireDate, 'yyyy-MM-dd'),
          }
        : DEFAULT_INITIAL_VALUE,
    [data],
  );

  const onClose = useCallback(async () => {
    await router.replace({ hash: undefined });
  }, [router]);

  const onSubmit = useCallback(
    async ({ expireDateString, iosUrl, aosUrl, ...restData }: FormData) => {
      const request: LinkFormData = {
        ...restData,
        iosUrl: iosUrl || null,
        aosUrl: aosUrl || null,
        expireDate: parse(expireDateString, 'yyyy-MM-dd', 0, {
          locale: ko,
        }).valueOf(),
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
                  if (
                    !params.every((x) =>
                      new RegExp(`(\\$${x})(?=\\b)`).test(url),
                    )
                  ) {
                    error[key] =
                      fieldTitles.webUrl + '와 동일한 변수를 사용해야합니다.';
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
          setSample(getUrl('XXXXXXXX', webUrl, true));
        } else {
          setSample(undefined);
        }
      }

      return error;
    },
    [],
  );

  return (
    <Modal
      open={!!(command && (command.type === 'add' || data))}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <ModalBox>
        <Container>
          <h2>{data ? `${data.key}` : '등록'}</h2>
          {sample && (
            <h5>
              예상 URL
              <Typography fontFamily="monospace">{sample}</Typography>
            </h5>
          )}
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
                <Stack>
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
                  <Box sx={{ display: 'flex', mt: 1, alignItems: 'center' }}>
                    <InputLabel htmlFor="appOnly">
                      {fieldTitles.appOnly}
                    </InputLabel>
                    <Switch
                      id="appOnly"
                      name="appOnly"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      checked={values.appOnly}
                    />
                  </Box>
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
                <Box textAlign="right" sx={{ my: 1 }}>
                  <Button type="submit" disabled={isSubmitting}>
                    {data ? '수정' : '등록'}
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
        </Container>
      </ModalBox>
    </Modal>
  );
}
