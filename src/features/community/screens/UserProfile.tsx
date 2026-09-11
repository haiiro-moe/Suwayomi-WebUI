/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { Mangas } from '@/features/manga/services/Mangas.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

export function UserProfile() {
    const { t } = useLingui();
    useAppTitle(t`User profile`);
    const navigate = useNavigate();
    const { userId } = useParams();
    const parsedUserId = Number(userId);
    const { data, loading, error } = requestManager.useGetUserProfile({ profileUserId: parsedUserId });
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
    const favorites = profile.favoriteManga ?? [];

    return (
        <Stack>
            <List sx={{ pt: 0 }}>
                <ListSubheader component="div">{t`Profile`}</ListSubheader>
                <ListItem>
                    <ListItemIcon>
                        {profile.avatarUrl ? (
                            <Box
                                component="img"
                                src={profile.avatarUrl}
                                alt={profile.displayName}
                                sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <AccountCircleIcon />
                        )}
                    </ListItemIcon>
                    <ListItemText primary={profile.displayName} secondary={`@${profile.username}`} />
                </ListItem>
                <ListItem>
                    <ListItemText primary={t`About`} secondary={profile.description || t`No description`} />
                </ListItem>
            </List>
            <ListSubheader component="div" sx={{ pt: 1 }}>
                {t`Favorites`} · {favorites.length}
            </ListSubheader>
            {favorites.length === 0 ? (
                <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>{t`No favorites yet.`}</Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                        p: 2,
                    }}
                >
                    {favorites.map((entry) => {
                        const { manga } = entry;
                        if (!entry.accessible || !manga) {
                            return (
                                <Tooltip key={entry.mangaId} title={t`No access`}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            aspectRatio: '2 / 3',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            bgcolor: 'action.hover',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <LockIcon color="disabled" />
                                    </Box>
                                </Tooltip>
                            );
                        }
                        return (
                            <Box
                                key={manga.id}
                                component={RouterLink}
                                to={AppRoutes.manga.path(manga.id)}
                                sx={{
                                    position: 'relative',
                                    aspectRatio: '2 / 3',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    display: 'block',
                                    bgcolor: 'action.hover',
                                    textDecoration: 'none',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={Mangas.getThumbnailUrl(manga)}
                                    alt={manga.title}
                                    loading="lazy"
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        px: 0.5,
                                        py: 0.25,
                                        color: 'common.white',
                                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {manga.title}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}
            <Button onClick={() => navigate(AppRoutes.conversation.path(parsedUserId))}>{t`Message`}</Button>
        </Stack>
    );
}
