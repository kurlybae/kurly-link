import React, { useCallback, useMemo, useState } from 'react';
import { LinkData } from '@/types';
import axios from 'axios';
import { Alert, Button, Container, IconButton, Snackbar } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { Close, ContentCopy, Delete, Edit } from '@mui/icons-material';
import copy from 'copy-to-clipboard';
import LinkForm from '@/components/LinkForm';
import { format } from 'date-fns';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Detail from '@/components/Detail';
import { Role } from '@/@types/next-auth';

type LinkDataGridColDef = GridColDef<LinkData> & {
  field: keyof LinkData | string;
};

function getColumns({
  user,
  deleteLink,
  copyLink,
}: {
  user?: { email: string; name: string; role: Role[] };
  deleteLink: (link: LinkData) => React.MouseEventHandler;
  copyLink: (key: string) => React.MouseEventHandler;
}): LinkDataGridColDef[] {
  const isAdmin = user?.role.includes('admin');
  return [
    {
      field: 'url',
      headerName: 'URL',
      sortable: false,
      width: 130,
      renderCell: ({ row: { key } }) => (
        <>
          <Link
            href={{ hash: key }}
            replace
            style={{ fontFamily: 'monospace' }}
            onClick={(e) => e.stopPropagation()}
          >
            {key}
          </Link>
          <IconButton size="small" onClick={copyLink(key)}>
            <ContentCopy fontSize="inherit" />
          </IconButton>
        </>
      ),
    },
    { field: 'webUrl', headerName: '웹 링크', width: 300, sortable: false },
    { field: 'iosUrl', headerName: 'IOS 링크', width: 100, sortable: false },
    {
      field: 'aosUrl',
      headerName: '안드로이드 링크',
      width: 100,
      sortable: false,
    },
    {
      field: 'appOnly',
      headerName: '앱 전용',
      width: 70,
      sortable: false,
      type: 'boolean',
    },
    {
      field: 'registerName',
      headerName: '등록자',
      width: 150,
      renderCell: ({ row: { registerName, registerEmail } }) => (
        <a
          href={`mailto:${registerEmail}`}
          onClick={(e) => e.stopPropagation()}
        >
          {registerName}
        </a>
      ),
    },
    {
      field: 'registerDate',
      headerName: '등록일',
      width: 150,
      valueGetter: ({ row: { registerDate } }) =>
        format(registerDate, 'yy/MM/dd HH:mm:ss'),
    },
    {
      field: 'expireDate',
      headerName: '만료일',
      width: 150,
      valueGetter: ({ row: { expireDate } }) =>
        format(expireDate, 'yy/MM/dd HH:mm:ss'),
    },
    {
      field: 'edit',
      headerName: '편집',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: ({ row: { key, registerEmail } }) => {
        const disabled = !isAdmin && registerEmail !== user?.email;
        const btn = (
          <IconButton size="small" disabled={disabled}>
            <Edit fontSize="inherit" />
          </IconButton>
        );
        return disabled ? (
          btn
        ) : (
          <Link
            href={{ hash: `edit-${key}` }}
            replace
            onClick={(e) => e.stopPropagation()}
          >
            {btn}
          </Link>
        );
      },
    },
    {
      field: 'delete',
      headerName: '삭제',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <IconButton
          size="small"
          onClick={deleteLink(row)}
          disabled={!isAdmin && row.registerEmail !== user?.email}
        >
          <Delete fontSize="inherit" />
        </IconButton>
      ),
    },
  ];
}

export default function Setting() {
  const [lastAdded, setLastAdded] = useState<{
    key: string;
    isEdit: boolean;
  }>();
  const [alertMessage, snackAlert] = useState<string>();
  const { data } = useQuery(
    'links',
    () => axios.get<LinkData[]>('/api/admin/links').then((x) => x.data),
    { refetchOnWindowFocus: false },
  );

  const queryClient = useQueryClient();

  const { data: session } = useSession();

  const [selectedKeys, selectKeys] = useState<string[]>([]);

  const user = useMemo(() => {
    if (session?.user.name && session.user.email) {
      return {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      };
    }
  }, [session?.user.email, session?.user.name, session?.user.role]);

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
    (key: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const link = `${location.origin}/${key}`;
      const result = copy(link);
      setLastAdded(undefined);
      snackAlert(result ? `복사되었습니다.\n${link}` : '복사에 실패하였습니다');
    },
    [],
  );

  const columns = useMemo(
    () => getColumns({ user, deleteLink, copyLink }),
    [user, deleteLink, copyLink],
  );

  const onSubmitComplete = useCallback((key: string, isEdit: boolean) => {
    setLastAdded({ key, isEdit });
  }, []);

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
              <Button size="small" onClick={copyLink(lastAdded?.key)}>
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
      <DataGrid<LinkData>
        sortModel={[{ field: 'registerDate', sort: 'desc' }]}
        rows={data ?? []}
        getRowId={(x) => x.key}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 5 },
          },
        }}
        pageSizeOptions={[5, 10]}
        checkboxSelection={user?.role.includes('admin')}
        rowSelection={user?.role.includes('admin')}
        onRowSelectionModelChange={(rowSelectionModel) =>
          selectKeys(rowSelectionModel.map((x) => x.toString()))
        }
      />
    </Container>
  );
}
