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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
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

    return (
        <Stack sx={{ height: '100%', p: 2 }}>
            <List sx={{ flex: 1, overflow: 'auto' }}>
                {(data?.conversation ?? []).map((message) => (
                    <ListItem key={message.id}>
                        <ListItemText primary={message.content} secondary={message.createdAt} />
                    </ListItem>
                ))}
            </List>
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
