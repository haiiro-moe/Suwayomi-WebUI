/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useLingui } from '@lingui/react/macro';
import { useNavigate, useParams } from 'react-router-dom';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

export function UserProfile() {
    const { t } = useLingui();
    useAppTitle(t`User profile`);
    const navigate = useNavigate();
    const { userId } = useParams();
    const parsedUserId = Number(userId);
    const { data, loading, error } = requestManager.useGetUserProfile({ userId: parsedUserId });
    if (loading && !data) {
        return <LoadingPlaceholder />;
    }
    if (error || !data?.profile) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load profile`}
                messageExtra={error ? getErrorMessage(error) : undefined}
            />
        );
    }
    const { profile } = data;
    return (
        <Stack>
            <List sx={{ pt: 0 }}>
                <ListSubheader component="div">{t`Profile`}</ListSubheader>
                <ListItem>
                    <ListItemIcon>
                        <AccountCircleIcon />
                    </ListItemIcon>
                    <ListItemText primary={profile.displayName} secondary={`@${profile.username}`} />
                </ListItem>
                <ListItem>
                    <ListItemText primary={t`About`} secondary={profile.description || t`No description`} />
                </ListItem>
                <ListItem>
                    <ListItemText primary={t`Favorites`} secondary={t`${profile.favoriteMangaIds.length} manga`} />
                </ListItem>
            </List>
            <Button onClick={() => navigate(AppRoutes.conversation.path(parsedUserId))}>{t`Message`}</Button>
        </Stack>
    );
}
