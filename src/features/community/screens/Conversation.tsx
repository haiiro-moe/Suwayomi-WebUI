/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { UserAvatar } from '@/features/community/components/UserAvatar.tsx';

export function Conversation() {
    const { t } = useLingui();
    const navigate = useNavigate();
    const { userId } = useParams();
    const otherUserId = Number(userId);
    const [content, setContent] = useState('');
    const scrollAnchorRef = useRef<HTMLDivElement>(null);
    const { data, loading, error, refetch } = requestManager.useGetConversation(
        { otherUserId },
        { pollInterval: 15000 },
    );
    const [sendMessage] = requestManager.useSendMessage();
    const [markMessageRead] = requestManager.useMarkMessageRead();

    const { data: profileData } = requestManager.useGetCurrentUserProfile();
    const myUserId = profileData?.currentUserProfile?.id;
    const { data: otherProfileData } = requestManager.useGetUserProfile({
        profileUserId: otherUserId,
    });
    const otherProfile = otherProfileData?.profile;

    useAppTitle(otherProfile ? t`Conversation with ${otherProfile.displayName}` : t`Conversation`);

    useEffect(() => {
        void Promise.all(
            (data?.conversation ?? [])
                .filter((message) => !message.readAt && message.receiverId !== otherUserId)
                .map((message) => markMessageRead({ variables: { input: { messageId: message.id } } })),
        );
    }, [data?.conversation, markMessageRead, otherUserId]);

    useEffect(() => {
        scrollAnchorRef.current?.scrollIntoView({ block: 'end' });
    }, [data?.conversation?.length]);

    if (loading && !data) {
        return <LoadingPlaceholder />;
    }
    if (error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load conversation`}
                messageExtra={getErrorMessage(error)}
                retry={() => refetch()}
            />
        );
    }

    const submit = async () => {
        const trimmed = content.trim();
        if (!trimmed) {
            return;
        }
        await sendMessage({
            variables: { input: { receiverId: otherUserId, content: trimmed } },
        });
        setContent('');
        await refetch();
    };

    const messages = data?.conversation ?? [];

    return (
        <Stack sx={{ height: '100%' }}>
            <Stack
                direction="row"
                spacing={1.5}
                sx={{
                    alignItems: 'center',
                    px: 1.5,
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <IconButton size="small" onClick={() => navigate(-1)} aria-label={t`Back`}>
                    <ArrowBackIcon />
                </IconButton>
                <Box
                    component={otherProfile ? RouterLink : 'div'}
                    to={otherProfile ? AppRoutes.userProfile.path(otherUserId) : undefined}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        minWidth: 0,
                        textDecoration: 'none',
                        color: 'inherit',
                    }}
                >
                    <UserAvatar
                        avatarUrl={otherProfile?.avatarUrl}
                        displayName={otherProfile?.displayName ?? '?'}
                        size={36}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
                        {otherProfile?.displayName ?? t`Conversation`}
                    </Typography>
                </Box>
            </Stack>

            <Stack spacing={0.75} sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.length === 0 && (
                    <Typography
                        color="text.secondary"
                        sx={{ textAlign: 'center', mt: 4 }}
                    >{t`No messages yet. Say hello!`}</Typography>
                )}
                {messages.map((message, index) => {
                    const isMine = message.senderId === myUserId;
                    const previous = messages[index - 1];
                    const isSameSenderAsPrevious = previous?.senderId === message.senderId;

                    return (
                        <Box
                            key={message.id}
                            sx={{
                                display: 'flex',
                                justifyContent: isMine ? 'flex-end' : 'flex-start',
                                maxWidth: '100%',
                                mt: isSameSenderAsPrevious ? 0.25 : 1.5,
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    px: 1.75,
                                    py: 1,
                                    maxWidth: '75%',
                                    color: isMine ? 'primary.contrastText' : 'text.primary',
                                    bgcolor: isMine ? 'primary.main' : 'action.hover',
                                    borderRadius: 2.5,
                                    ...(isMine
                                        ? {
                                              borderBottomRightRadius: isSameSenderAsPrevious ? 2.5 : 0.5,
                                          }
                                        : {
                                              borderBottomLeftRadius: isSameSenderAsPrevious ? 2.5 : 0.5,
                                          }),
                                    wordBreak: 'break-word',
                                }}
                            >
                                <Typography variant="body2">{message.content}</Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        mt: 0.25,
                                        textAlign: 'right',
                                        opacity: 0.7,
                                    }}
                                >
                                    {dayjs(Number(message.createdAt)).format('LT')}
                                </Typography>
                            </Paper>
                        </Box>
                    );
                })}
                <div ref={scrollAnchorRef} />
            </Stack>
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    p: 1.5,
                    borderTop: 1,
                    borderColor: 'divider',
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void submit();
                        }
                    }}
                    placeholder={t`Write a message`}
                    slotProps={{
                        input: {
                            sx: { borderRadius: 999, bgcolor: 'background.default' },
                        },
                    }}
                />
                <IconButton
                    aria-label={t`Send`}
                    color="primary"
                    disabled={!content.trim()}
                    onClick={() => void submit()}
                    sx={{
                        bgcolor: content.trim() ? 'primary.main' : 'action.disabledBackground',
                        color: content.trim() ? 'primary.contrastText' : undefined,
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&.Mui-disabled': { color: 'action.disabled' },
                    }}
                >
                    <SendIcon fontSize="small" />
                </IconButton>
            </Box>
        </Stack>
    );
}
