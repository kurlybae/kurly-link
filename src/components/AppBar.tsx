import * as React from 'react';

import {
  Avatar,
  IconButton,
  Typography,
  Toolbar,
  Box,
  AppBar as MuiAppBar,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import { signOut, useSession } from 'next-auth/react';
import { DatasetLinked } from '@mui/icons-material';

export default function AppBar({ title }: { title: string }) {
  const { data: session } = useSession();

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null,
  );

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  if (!session) {
    return null;
  }
  return (
    <Box sx={{ flexGrow: 1 }}>
      <MuiAppBar position="static" elevation={0} variant="outlined">
        <Toolbar>
          <DatasetLinked sx={{ mr: 2 }} />
          {/*<IconButton*/}
          {/*  size="large"*/}
          {/*  edge="start"*/}
          {/*  color="inherit"*/}
          {/*  aria-label="menu"*/}
          {/*  sx={{ mr: 2 }}*/}
          {/*>*/}
          {/*  <MenuIcon />*/}
          {/*</IconButton>*/}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title={session.user.name}>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  sx={{ bgcolor: 'white' }}
                  alt={session.user.name ?? undefined}
                  src={session.user.image ?? undefined}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => signOut()}>
                <Typography textAlign="center">로그아웃</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </MuiAppBar>
    </Box>
  );
}
