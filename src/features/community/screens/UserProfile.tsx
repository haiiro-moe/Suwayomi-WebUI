/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ChatIcon from '@mui/icons-material/Chat';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LockIcon from '@mui/icons-material/Lock';
import Paper from '@mui/material/Paper';
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
import { ProfileThemeProvider } from '@/features/theme/ProfileThemeProvider.tsx';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

const AVATAR_SIZE = 120;

export function UserProfile() {
    const { t } = useLingui();
    useAppTitle(t`User profile`);
    const navigate = useNavigate();
    const { userId } = useParams();
    const parsedUserId = Number(userId);
    const { data, loading, error } = requestManager.useGetUserProfile({
        profileUserId: parsedUserId,
    });
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
        <ProfileThemeProvider
            settings={{
                appTheme: profile.appTheme,
                themeMode: profile.themeMode,
                pureBlackMode: profile.pureBlackMode,
            }}
        >
            <Box sx={{ pb: 3 }}>
                {/* Banner */}
                <Box
                    sx={{
                        position: 'relative',
                        height: { xs: 160, sm: 220 },
                        width: '100%',
                        backgroundImage: profile.bannerUrl
                            ? `url(${profile.bannerUrl})`
                            : (theme) =>
                                  `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 45%, ${theme.palette.secondary.main} 100%)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {!!profile.bannerUrl && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)',
                            }}
                        />
                    )}
                </Box>

                {/* Avatar + username row */}
                <Stack
                    direction="row"
                    sx={{
                        px: { xs: 2, sm: 4 },
                        mt: `-${AVATAR_SIZE / 2}px`,
                        alignItems: 'flex-end',
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            borderRadius: 4,
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: 4,
                            borderColor: 'background.default',
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            transition: (theme) => theme.transitions.create(['box-shadow']),
                        }}
                    >
                        {profile.avatarUrl ? (
                            <Box
                                component="img"
                                src={profile.avatarUrl}
                                alt={profile.displayName}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        ) : (
                            <Stack
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: (theme) =>
                                        `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                }}
                            >
                                <Typography variant="h4" component="span" sx={{ color: 'primary.contrastText' }}>
                                    {profile.displayName.charAt(0).toUpperCase()}
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                    <Box sx={{ pb: 1.5, flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="h5"
                            component="h1"
                            sx={{
                                display: 'inline-flex',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2.5,
                                bgcolor: (theme) =>
                                    theme.palette.mode === 'dark'
                                        ? 'rgba(18, 18, 18, 0.72)'
                                        : 'rgba(255, 255, 255, 0.82)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: 1,
                                wordBreak: 'break-word',
                            }}
                        >
                            {profile.displayName}
                        </Typography>
                        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, ml: 1.5 }}>
                            @{profile.username}
                        </Typography>
                    </Box>
                    <Box sx={{ pb: 1.5 }}>
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<ChatIcon />}
                            onClick={() => navigate(AppRoutes.conversation.path(parsedUserId))}
                            sx={{
                                borderRadius: 999,
                                px: 2.5,
                                transition: (theme) => theme.transitions.create(['transform', 'box-shadow']),
                                '&:hover': { transform: 'translateY(-1px)', boxShadow: 3 },
                            }}
                        >
                            {t`Message`}
                        </Button>
                    </Box>
                </Stack>

                {/* Description + favorites panels */}
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    sx={{ px: { xs: 2, sm: 4 }, mt: 3, gap: 2, alignItems: 'stretch' }}
                >
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            width: { md: '30%' },
                            flexShrink: 0,
                            alignSelf: 'flex-start',
                            borderRadius: 3,
                        }}
                    >
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                            <DescriptionOutlinedIcon fontSize="small" color="action" />
                            <Typography variant="h6" component="h2">
                                {t`Description`}
                            </Typography>
                        </Stack>
                        <Typography
                            variant="body1"
                            color={profile.description ? 'text.primary' : 'text.secondary'}
                            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        >
                            {profile.description || t`No description.`}
                        </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 0, borderRadius: 3 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                            <FavoriteIcon fontSize="small" color="action" />
                            <Typography variant="h6" component="h2">
                                {t`Favorites`}
                            </Typography>
                            <Chip label={favorites.length} size="small" sx={{ fontWeight: 600 }} />
                        </Stack>
                        {favorites.length === 0 ? (
                            <Typography color="text.secondary">{t`No favorites yet.`}</Typography>
                        ) : (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: 'repeat(2, 1fr)',
                                        sm: 'repeat(3, 1fr)',
                                        lg: 'repeat(4, 1fr)',
                                    },
                                    gap: 1.5,
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
                                                        borderRadius: 1.5,
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
                                        <Tooltip key={manga.id} title={manga.title}>
                                            <Box
                                                component={RouterLink}
                                                to={AppRoutes.manga.path(manga.id)}
                                                sx={{
                                                    position: 'relative',
                                                    aspectRatio: '2 / 3',
                                                    borderRadius: 1.5,
                                                    overflow: 'hidden',
                                                    display: 'block',
                                                    bgcolor: 'action.hover',
                                                    textDecoration: 'none',
                                                    boxShadow: 1,
                                                    transition: (theme) =>
                                                        theme.transitions.create(['transform', 'box-shadow'], {
                                                            duration: theme.transitions.duration.shortest,
                                                        }),
                                                    '@media (hover: hover) and (pointer: fine)': {
                                                        '&:hover': {
                                                            transform: 'translateY(-3px)',
                                                            boxShadow: 4,
                                                        },
                                                    },
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={Mangas.getThumbnailUrl(manga)}
                                                    alt={manga.title}
                                                    loading="lazy"
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                    }}
                                                />
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        pt: 2,
                                                        background:
                                                            'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            display: 'block',
                                                            px: 0.75,
                                                            py: 0.5,
                                                            color: 'common.white',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {manga.title}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        )}
                    </Paper>
                </Stack>
            </Box>
        </ProfileThemeProvider>
    );
}
