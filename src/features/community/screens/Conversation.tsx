/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import SendIcon from '@mui/icons-material/Send';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

export function Conversation() {
    const { t } = useLingui();
    useAppTitle(t`Conversation`);
    const { userId } = useParams();
    const otherUserId = Number(userId);
    const [content, setContent] = useState('');
    const { data, loading, error, refetch } = requestManager.useGetConversation(
        { otherUserId },
        { pollInterval: 15000 },
    );
    const [sendMessage] = requestManager.useSendMessage();
    const [markMessageRead] = requestManager.useMarkMessageRead();

    const { data: profileData } = requestManager.useGetCurrentUserProfile();
    const myUserId = profileData?.currentUserProfile?.id;
    useEffect(() => {
        void Promise.all(
            (data?.conversation ?? [])
                .filter((message) => !message.readAt && message.receiverId !== otherUserId)
                .map((message) => markMessageRead({ variables: { input: { messageId: message.id } } })),
        );
    }, [data?.conversation, markMessageRead, otherUserId]);

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
        await sendMessage({ variables: { input: { receiverId: otherUserId, content: trimmed } } });
        setContent('');
        await refetch();
    };

    const messages = data?.conversation ?? [];

    return (
        <Stack sx={{ height: '100%', p: 2 }}>
            <Stack spacing={1.5} sx={{ flex: 1, overflow: 'auto', py: 1 }}>
                {messages.length === 0 && (
                    <Typography color="text.secondary" sx={{ textAlign: 'center' }}>{t`No messages yet.`}</Typography>
                )}
                {messages.map((message) => {
                    const isMine = message.senderId === myUserId;
                    return (
                        <Box
                            key={message.id}
                            sx={{
                                display: 'flex',
                                justifyContent: isMine ? 'flex-end' : 'flex-start',
                                maxWidth: '100%',
                            }}
                        >
                            <Paper
                                variant="outlined"
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    maxWidth: '75%',
                                    bgcolor: isMine ? 'action.selected' : 'background.paper',
                                    borderRadius: 2,
                                    wordBreak: 'break-word',
                                }}
                            >
                                <Typography variant="body1">{message.content}</Typography>
                                <Typography color="text.secondary" variant="caption">
                                    {dayjs(Number(message.createdAt)).format('LLL')}
                                </Typography>
                            </Paper>
                        </Box>
                    );
                })}
            </Stack>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void submit();
                        }
                    }}
                    placeholder={t`Write a message`}
                />
                <Button aria-label={t`Send`} onClick={() => void submit()}>
                    <SendIcon />
                </Button>
            </Box>
        </Stack>
    );
}
