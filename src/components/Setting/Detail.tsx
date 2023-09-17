import React, { useCallback, useMemo } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { LinkData } from '@/types';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { ContentCopy } from '@mui/icons-material';
import TextLink from '@/shared/utils/TextLink';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { KEY_REGEX_SOURCE } from '@/shared/constants/key';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getUrl } from '@/shared/utils/url-helper';

const hashRegex = new RegExp(`#(${KEY_REGEX_SOURCE})$`);

function parsePath(asPath: string): string | undefined {
  const match = hashRegex.exec(asPath);
  if (match) {
    return match[1];
  }
}

export default function Detail({
  copyLink,
}: {
  copyLink: (key: string, webUrl: string) => React.MouseEventHandler;
}) {
  const router = useRouter();
  const key = useMemo(() => parsePath(router.asPath), [router.asPath]);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { data: session } = useSession();

  const { data, isLoading } = useQuery(
    `links/${key}`,
    () =>
      key
        ? axios.get<LinkData>(`/api/admin/links/${key}`).then((x) => x.data)
        : undefined,
    { refetchOnWindowFocus: false, retry: false },
  );
  const isOwner =
    session?.user.role.includes('admin') ||
    session?.user.email === data?.registerEmail;

  const url = useMemo(
    () => key && data && getUrl(key, data.webUrl),
    [data, key],
  );

  const onClose = useCallback(() => {
    router.replace({ hash: undefined });
  }, [router]);

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      open={!!data && !isLoading}
      onClose={onClose}
      aria-labelledby="link-form-dialog-title"
    >
      <DialogTitle id="link-form-dialog-title">{key}</DialogTitle>

      <DialogContent>
        {data && (
          <>
            {data.bridgeType === 'app_only' && (
              <Chip label="앱 전용" color="primary" variant="outlined" />
            )}
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>URL</TableCell>
                  <TableCell>
                    <TextLink
                      target="_blank"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {url}
                    </TextLink>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={copyLink(data.key, data.webUrl)}
                    >
                      <ContentCopy fontSize="inherit" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>웹 링크</TableCell>
                  <TableCell colSpan={2}>
                    <TextLink
                      target="_blank"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {data.webUrl}
                    </TextLink>
                  </TableCell>
                </TableRow>
                {data.iosUrl && (
                  <TableRow>
                    <TableCell>IOS</TableCell>
                    <TableCell colSpan={2}>
                      <TextLink
                        target="_blank"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {data.iosUrl}
                      </TextLink>
                    </TableCell>
                  </TableRow>
                )}
                {data.aosUrl && (
                  <TableRow>
                    <TableCell>안드로이드</TableCell>
                    <TableCell colSpan={2}>
                      <TextLink
                        target="_blank"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {data.aosUrl}
                      </TextLink>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell rowSpan={2}>등록자</TableCell>
                  <TableCell colSpan={2}>{data.registerName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2}>
                    <TextLink
                      target="_blank"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {data.registerEmail}
                    </TextLink>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>등록일</TableCell>
                  <TableCell colSpan={2}>
                    {format(data.registerDate, 'yyyy-MM-dd HH:mm:ss', {
                      locale: ko,
                    })}{' '}
                    GMT+0900 (한국 표준시)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>만료일</TableCell>
                  <TableCell colSpan={2}>
                    {format(data.expireDate, 'yyyy-MM-dd HH:mm:ss', {
                      locale: ko,
                    })}{' '}
                    GMT+0900 (한국 표준시)
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {isOwner && (
          <Link replace href={{ hash: `edit-${key}` }}>
            <Button>수정</Button>
          </Link>
        )}
        <Button onClick={onClose}>확인</Button>
      </DialogActions>
    </Dialog>
  );
}
