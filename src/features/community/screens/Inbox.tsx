/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MailIcon from '@mui/icons-material/Mail';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { useLingui } from '@lingui/react/macro';
import { useNavigate } from 'react-router-dom';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';

export function Inbox() {
    const { t } = useLingui();
    useAppTitle(t`Messages`);
    const navigate = useNavigate();
    const { data, loading } = requestManager.useGetUserDirectory({ fetchPolicy: 'cache-and-network' });
    if (loading && !data) {
        return <LoadingPlaceholder />;
    }
    return (
        <List sx={{ pt: 0 }}>
            <ListSubheader component="div">{t`Start a conversation`}</ListSubheader>
            {(data?.userDirectory ?? []).map((user) => (
                <ListItem key={user.id} disablePadding>
                    <ListItemButton onClick={() => navigate(AppRoutes.conversation.path(user.id))}>
                        <ListItemIcon>
                            <MailIcon />
                        </ListItemIcon>
                        <ListItemText primary={user.displayName} secondary={`@${user.username}`} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    );
}
