import React, { useMemo } from 'react';
import { LinkData } from '@/types';
import axios from 'axios';
import { IconButton } from '@mui/material';
import { useQuery } from 'react-query';
import { ContentCopy, Delete, Edit } from '@mui/icons-material';
import { format } from 'date-fns';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type LinkDataGridColDef = GridColDef<LinkData> & {
  field: keyof LinkData | string;
};

export default function LinkDataTable({
  deleteLink,
  copyLink,
  selectKeys,
}: {
  deleteLink: (link: LinkData) => React.MouseEventHandler;
  copyLink: (key: string, webUrl: string) => React.MouseEventHandler;
  selectKeys: (key: string[]) => void;
}) {
  const { data } = useQuery(
    'links',
    () => axios.get<LinkData[]>('/api/admin/links').then((x) => x.data),
    { refetchOnWindowFocus: false },
  );

  const { data: session } = useSession();

  const user = useMemo(() => {
    if (session && session.user.name && session.user.email) {
      return {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      };
    }
  }, [session]);

  const columns = useMemo((): LinkDataGridColDef[] => {
    const isAdmin = user?.role.includes('admin');
    return [
      {
        field: 'url',
        headerName: 'URL',
        sortable: false,
        width: 130,
        renderCell: ({ row: { key, webUrl } }) => (
          <>
            <Link
              href={{ hash: key }}
              replace
              style={{ fontFamily: 'monospace' }}
              onClick={(e) => e.stopPropagation()}
            >
              {key}
            </Link>
            <IconButton size="small" onClick={copyLink(key, webUrl)}>
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
  }, [user, deleteLink, copyLink]);

  return (
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
  );
}
