import React, { useCallback, useState } from 'react';
import { LinkData } from '@/types';
import axios from 'axios';
import { Alert, Button, Container, IconButton, Snackbar } from '@mui/material';
import { useQueryClient } from 'react-query';
import { Close } from '@mui/icons-material';
import copy from 'copy-to-clipboard';
import LinkForm from '@/components/Setting/LinkForm';
import { format } from 'date-fns';
import Link from 'next/link';
import Detail from '@/components/Setting/Detail';
import LinkDataTable from '@/components/Setting/LinkDataTable';
import { getUrl } from '@/shared/utils/url-helper';

export default function Setting() {
  const [lastAdded, setLastAdded] = useState<{
    key: string;
    isEdit: boolean;
    webUrl: string;
  }>();
  const [alertMessage, snackAlert] = useState<string>();

  const queryClient = useQueryClient();

  const [selectedKeys, selectKeys] = useState<string[]>([]);

  const deleteLink = useCallback(
    (input: string[] | LinkData) => async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (input instanceof Array) {
        if (
          !confirm(`(주의!) ${input.length}개 항목을 정말 삭제하시겠습니까?`)
        ) {
          return;
        }
      } else {
        if (
          !confirm(
            `(주의!) 아래 항목을 정말 삭제하시겠습니까?\n${input.key}\n${
              input.webUrl
            }\n등록자 : ${input.registerName}\n등록일 : ${format(
              input.registerDate,
              'yyyy년 MM월 dd일 HH시 mm분',
            )}`,
          )
        ) {
          return;
        }
      }
      const target = input instanceof Array ? input : [input.key];
      await axios.delete(`/api/admin/links/${target.join(',')}`);
      void queryClient.invalidateQueries('links');
    },
    [queryClient],
  );

  const copyLink = useCallback(
    (key: string, webUrl: string) =>
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const link = getUrl(key, webUrl);
        const result = copy(link);
        setLastAdded(undefined);
        snackAlert(
          result ? `복사되었습니다.\n${link}` : '복사에 실패하였습니다',
        );
      },
    [],
  );

  const onSubmitComplete = useCallback(
    (key: string, isEdit: boolean, webUrl: string) => {
      setLastAdded({ key, isEdit, webUrl });
    },
    [],
  );

  return (
    <Container sx={{ pt: 3 }}>
      <Link replace href={{ hash: 'add' }}>
        <Button>등록</Button>
      </Link>
      {selectedKeys.length > 0 && (
        <Button onClick={deleteLink(selectedKeys)}>삭제</Button>
      )}
      <LinkForm onSubmitComplete={onSubmitComplete} />
      <Detail copyLink={copyLink} />
      <Snackbar
        open={!!lastAdded}
        autoHideDuration={10000}
        onClose={() => setLastAdded(undefined)}
        message={lastAdded?.isEdit ? '수정완료' : '등록완료'}
        action={
          lastAdded ? (
            <React.Fragment>
              <Button
                size="small"
                onClick={copyLink(lastAdded.key, lastAdded.webUrl)}
              >
                복사
              </Button>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => setLastAdded(undefined)}
              >
                <Close fontSize="small" />
              </IconButton>
            </React.Fragment>
          ) : undefined
        }
      />
      <Snackbar
        open={!!alertMessage}
        autoHideDuration={3000}
        onClose={() => snackAlert(undefined)}
      >
        <Alert>{alertMessage}</Alert>
      </Snackbar>
      <LinkDataTable
        copyLink={copyLink}
        deleteLink={deleteLink}
        selectKeys={selectKeys}
      />
    </Container>
  );
}
