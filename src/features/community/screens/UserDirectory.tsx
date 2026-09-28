/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Chip from '@mui/material/Chip';
import { Fragment } from 'react';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { useLingui } from '@lingui/react/macro';
import { useNavigate } from 'react-router-dom';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { UserAvatar } from '@/features/community/components/UserAvatar.tsx';

export function UserDirectory() {
    const { t } = useLingui();
    useAppTitle(t`User directory`);
    const navigate = useNavigate();
    const { data, loading, error, refetch } = requestManager.useGetUserDirectory({
        fetchPolicy: 'cache-and-network',
    });

    if (loading && !data) {
        return <LoadingPlaceholder />;
    }
    if (error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load user directory`}
                messageExtra={getErrorMessage(error)}
                retry={() => refetch().catch(defaultPromiseErrorHandler('UserDirectory::refetch'))}
            />
        );
    }

    const users = data?.userDirectory ?? [];

    return (
        <List sx={{ pt: 0 }}>
            <ListSubheader component="div">{t`Users`}</ListSubheader>
            {users.length === 0 && <EmptyViewAbsoluteCentered message={t`No other users yet.`} />}
            {users.map((user, index) => (
                <Fragment key={user.id}>
                    {index > 0 && <Divider component="li" variant="inset" sx={{ ml: 9 }} />}
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate(AppRoutes.userProfile.path(user.id))} sx={{ py: 1.25 }}>
                            <ListItemAvatar>
                                <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} size={44} />
                            </ListItemAvatar>
                            <ListItemText primary={user.displayName} secondary={`@${user.username}`} />
                            <Chip label={user.role} size="small" variant="outlined" sx={{ ml: 1 }} />
                        </ListItemButton>
                    </ListItem>
                </Fragment>
            ))}
        </List>
    );
}
