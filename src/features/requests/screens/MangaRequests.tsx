/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { usePermissions } from '@/features/authentication/usePermissions.ts';

const STATUS_TO_COLOR = {
    PENDING: 'warning',
    APPROVED: 'success',
    DENIED: 'error',
} as const;

export function MangaRequests() {
    const { t } = useLingui();
    useAppTitle(t`Manga requests`);
    const permissions = usePermissions();
    const canManage = permissions.has('requests.manage');

    const { data, loading, error, refetch } = requestManager.useGetMangaRequests({ pollInterval: 30000 });
    const [decideRequest] = requestManager.useDecideMangaRequest();

    if (loading && !data) {
        return <LoadingPlaceholder />;
    }
    if (error || !data) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load requests`}
                messageExtra={error ? getErrorMessage(error) : undefined}
                retry={() => refetch()}
            />
        );
    }

    const decide = async (requestId: number, approve: boolean) => {
        try {
            await decideRequest({ variables: { input: { requestId, approve } } });
            await refetch();
        } catch (decideError) {
            makeToast(
                approve ? t`Could not approve request` : t`Could not deny request`,
                'error',
                getErrorMessage(decideError),
            );
        }
    };

    const requests = data.mangaRequests;

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" component="h1" sx={{ mb: 2 }}>{t`Manga requests`}</Typography>
            {requests.length === 0 ? (
                <Typography color="text.secondary">{t`No requests yet.`}</Typography>
            ) : (
                <Stack spacing={1.5}>
                    {requests.map((request) => (
                        <Card key={request.id} variant="outlined">
                            <CardContent sx={{ pb: 0 }}>
                                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                    {request.mangaThumbnailUrl ? (
                                        <Box
                                            component="img"
                                            src={request.mangaThumbnailUrl}
                                            alt={request.mangaTitle ?? ''}
                                            sx={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 1 }}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 60,
                                                borderRadius: 1,
                                                bgcolor: 'action.hover',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Typography variant="caption">?</Typography>
                                        </Box>
                                    )}
                                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle1" sx={{ wordBreak: 'break-word' }}>
                                            {request.mangaTitle ?? t`Manga you cannot see`}
                                        </Typography>
                                        <Typography color="text.secondary" variant="body2">
                                            {`${request.displayName} (@${request.username}) · ${dayjs(Number(request.createdAt)).format('LLL')}`}
                                        </Typography>
                                    </Stack>
                                    <Chip
                                        label={request.status}
                                        color={
                                            STATUS_TO_COLOR[request.status as keyof typeof STATUS_TO_COLOR] ?? 'default'
                                        }
                                        size="small"
                                    />
                                </Stack>
                            </CardContent>
                            {canManage && request.status === 'PENDING' && (
                                <CardActions sx={{ justifyContent: 'flex-end' }}>
                                    <Button color="error" onClick={() => decide(request.id, false)}>{t`Deny`}</Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => decide(request.id, true)}
                                    >{t`Approve`}</Button>
                                </CardActions>
                            )}
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
