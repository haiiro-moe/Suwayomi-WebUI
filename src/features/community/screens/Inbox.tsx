/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { UserAvatar } from '@/features/community/components/UserAvatar.tsx';

function ConversationListItem({
    user,
}: {
    user: {
        id: number;
        username: string;
        displayName: string;
        avatarUrl?: string | null;
    };
}) {
    const { t } = useLingui();
    const navigate = useNavigate();
    const { data, loading } = requestManager.useGetConversation(
        { otherUserId: user.id },
        { pollInterval: 15000, fetchPolicy: 'cache-and-network' },
    );
    const messages = data?.conversation ?? [];
    const lastMessage = messages.at(-1);
    const unread = messages.filter((message) => !message.readAt && message.receiverId !== user.id).length;
    const hasUnread = unread > 0;
    const secondary =
        loading && !lastMessage ? t`Loading conversation…` : (lastMessage?.content ?? `@${user.username}`);

    return (
        <ListItem disablePadding>
            <ListItemButton onClick={() => navigate(AppRoutes.conversation.path(user.id))} sx={{ py: 1.25 }}>
                <ListItemAvatar>
                    <Badge
                        badgeContent={unread || undefined}
                        color="primary"
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                        <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} size={44} />
                    </Badge>
                </ListItemAvatar>
                <ListItemText
                    primary={user.displayName}
                    secondary={secondary}
                    slotProps={{
                        primary: { sx: { fontWeight: hasUnread ? 700 : 500 } },
                        secondary: {
                            noWrap: true,
                            color: hasUnread ? 'text.primary' : 'text.secondary',
                        },
                    }}
                />
                {!!lastMessage && (
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                        {dayjs(Number(lastMessage.createdAt)).fromNow()}
                    </Typography>
                )}
            </ListItemButton>
        </ListItem>
    );
}

export function Inbox() {
    const { t } = useLingui();
    useAppTitle(t`Messages`);
    const { data, loading } = requestManager.useGetUserDirectory({
        fetchPolicy: 'cache-and-network',
    });
    const { data: profileData } = requestManager.useGetCurrentUserProfile();
    const myUserId = profileData?.currentUserProfile?.id;

    if (loading && !data) {
        return <LoadingPlaceholder />;
    }

    const otherUsers = (data?.userDirectory ?? []).filter((user) => user.id !== myUserId);

    return (
        <List sx={{ pt: 0 }}>
            <ListSubheader component="div">{t`Conversations`}</ListSubheader>
            {otherUsers.length === 0 && <EmptyViewAbsoluteCentered message={t`No one else to message yet.`} />}
            {otherUsers.map((user, index) => (
                <Fragment key={user.id}>
                    {index > 0 && <Divider component="li" variant="inset" sx={{ ml: 9 }} />}
                    <ConversationListItem user={user} />
                </Fragment>
            ))}
        </List>
    );
}
