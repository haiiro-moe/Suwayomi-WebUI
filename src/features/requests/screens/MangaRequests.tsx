/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ReactElement } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { AwaitableComponent } from 'awaitable-component';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { usePermissions } from '@/features/authentication/usePermissions.ts';
import { CategorySelect } from '@/features/category/components/CategorySelect';

const STATUS_TO_COLOR = {
    PENDING: 'warning',
    APPROVED: 'success',
    DENIED: 'error',
} as const;

const STATUS_TO_ICON: Record<string, ReactElement> = {
    PENDING: <HourglassEmptyIcon fontSize="small" />,
    APPROVED: <CheckCircleOutlineIcon fontSize="small" />,
    DENIED: <HighlightOffIcon fontSize="small" />,
};

export function MangaRequests() {
    const { t } = useLingui();
    useAppTitle(t`Manga requests`);
    const permissions = usePermissions();
    const canManage = permissions.has('requests.manage');

    const { data, loading, error, refetch } = requestManager.useGetMangaRequests({
        pollInterval: 30000,
    });
    const [decideRequest] = requestManager.useDecideMangaRequest();
    const [updateMangaCategories] = requestManager.useUpdateMangaCategories();

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

    const decide = async (requestId: number, approve: boolean, mangaId?: number) => {
        try {
            await decideRequest({ variables: { input: { requestId, approve } } });

            if (approve && mangaId !== undefined) {
                // let the approver pick categories, mirroring the add-to-library flow
                const { addToCategories = [], removeFromCategories = [] } = await AwaitableComponent.show(
                    CategorySelect,
                    { mangaId, addToLibrary: false },
                    { id: `manga-request-approve-categories-${requestId}` },
                );

                if (addToCategories.length || removeFromCategories.length) {
                    await updateMangaCategories({
                        variables: {
                            input: {
                                id: mangaId,
                                patch: { addToCategories, removeFromCategories },
                            },
                        },
                    });
                }

                // the approved manga just entered the library - invalidate library queries so it shows up without a reload
                requestManager.graphQLClient.client.cache.evict({
                    fieldName: 'mangas',
                });
                requestManager.graphQLClient.client.cache.evict({
                    fieldName: 'categories',
                });
            }

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
    const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
    // pending requests need attention first - surface them at the top without reordering ties
    const sortedRequests = [...requests].sort((a, b) => {
        const aPending = a.status === 'PENDING' ? 0 : 1;
        const bPending = b.status === 'PENDING' ? 0 : 1;
        return aPending - bPending;
    });

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">
                    {t`Manga requests`}
                </Typography>
                {pendingCount > 0 && (
                    <Chip label={t`${pendingCount} pending`} color="warning" size="small" sx={{ fontWeight: 600 }} />
                )}
            </Stack>
            {requests.length === 0 ? (
                <Stack sx={{ alignItems: 'center', py: 6, gap: 1 }}>
                    <InboxOutlinedIcon sx={{ fontSize: 40 }} color="disabled" />
                    <Typography color="text.secondary">{t`No requests yet.`}</Typography>
                </Stack>
            ) : (
                <Stack spacing={1.5}>
                    {sortedRequests.map((request) => {
                        const isPending = request.status === 'PENDING';
                        return (
                            <Card
                                key={request.id}
                                variant="outlined"
                                sx={{
                                    borderRadius: 2.5,
                                    opacity: isPending ? 1 : 0.72,
                                    transition: (theme) => theme.transitions.create(['opacity', 'box-shadow']),
                                    ...(isPending && { borderColor: 'warning.main' }),
                                }}
                            >
                                <CardContent sx={{ pb: 0 }}>
                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                        {request.mangaThumbnailUrl ? (
                                            <Box
                                                component="img"
                                                src={request.mangaThumbnailUrl}
                                                alt={request.mangaTitle ?? ''}
                                                sx={{
                                                    width: 42,
                                                    height: 60,
                                                    objectFit: 'cover',
                                                    borderRadius: 1.5,
                                                    boxShadow: 1,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    width: 42,
                                                    height: 60,
                                                    borderRadius: 1.5,
                                                    bgcolor: 'action.hover',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Typography variant="caption">?</Typography>
                                            </Box>
                                        )}
                                        <Stack sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle1" sx={{ wordBreak: 'break-word' }}>
                                                {request.mangaTitle ?? t`Manga you cannot see`}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2" noWrap>
                                                {request.displayName} (@{request.username})
                                            </Typography>
                                            <Tooltip title={dayjs(Number(request.createdAt)).format('LLL')}>
                                                <Typography color="text.secondary" variant="caption">
                                                    {dayjs(Number(request.createdAt)).fromNow()}
                                                </Typography>
                                            </Tooltip>
                                        </Stack>
                                        <Chip
                                            icon={STATUS_TO_ICON[request.status]}
                                            label={request.status}
                                            color={
                                                STATUS_TO_COLOR[request.status as keyof typeof STATUS_TO_COLOR] ??
                                                'default'
                                            }
                                            size="small"
                                            variant={isPending ? 'filled' : 'outlined'}
                                        />
                                    </Stack>
                                </CardContent>
                                {canManage && isPending && (
                                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                                        <Button color="error" onClick={() => decide(request.id, false)}>
                                            {t`Deny`}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            disableElevation
                                            onClick={() => decide(request.id, true, request.mangaId)}
                                        >
                                            {t`Approve`}
                                        </Button>
                                    </CardActions>
                                )}
                            </Card>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
}
