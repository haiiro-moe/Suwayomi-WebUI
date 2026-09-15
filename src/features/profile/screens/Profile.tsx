/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import CollectionsBookmarkOutlinedIcon from '@mui/icons-material/CollectionsBookmarkOutlined';
import Divider from '@mui/material/Divider';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import LinkIcon from '@mui/icons-material/Link';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { TextSetting } from '@/base/components/settings/text/TextSetting.tsx';
import { makeToast } from '@/base/utils/Toast.ts';
import { Confirmation } from '@/base/AppAwaitableComponent.ts';

const PREVIEW_AVATAR_SIZE = 72;

export function Profile() {
    const { t } = useLingui();
    const navigate = useNavigate();
    useAppTitle(t`Profile`);
    const [isSaving, setIsSaving] = useState(false);
    const { data, loading, error, refetch } = requestManager.useGetCurrentUserProfile({
        fetchPolicy: 'cache-and-network',
    });
    const [updateProfile] = requestManager.useUpdateProfile({
        refetchQueries: ['GET_CURRENT_USER_PROFILE'],
    });

    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [description, setDescription] = useState('');

    const profile = data?.currentUserProfile;
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.displayName);
            setAvatarUrl(profile.avatarUrl ?? '');
            setBannerUrl(profile.bannerUrl ?? '');
            setDescription(profile.description);
        }
    }, [profile?.id, profile?.displayName, profile?.avatarUrl, profile?.bannerUrl, profile?.description]);

    if (loading && !profile) {
        return <LoadingPlaceholder />;
    }

    if (error || !profile) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load profile`}
                messageExtra={error ? getErrorMessage(error) : undefined}
                retry={() => refetch().catch(defaultPromiseErrorHandler('Profile::refetch'))}
            />
        );
    }

    const logout = async () => {
        await Confirmation.show({
            title: t`Log out?`,
            message: t`You will need to log in again to access your account.`,
            actions: {
                confirm: { title: t`Log out` },
            },
        });

        requestManager.reset();
        navigate(AppRoutes.authentication.children.login.path, { replace: true });
    };

    const save = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                variables: {
                    input: {
                        displayName: displayName.trim() || profile.displayName,
                        avatarUrl,
                        bannerUrl,
                        description,
                    },
                },
            });
            makeToast(t`Profile saved`, 'success');
        } catch (saveError) {
            makeToast(t`Failed to save profile`, 'error', getErrorMessage(saveError));
        } finally {
            setIsSaving(false);
        }
    };

    const dirty =
        displayName !== profile.displayName ||
        avatarUrl !== (profile.avatarUrl ?? '') ||
        bannerUrl !== (profile.bannerUrl ?? '') ||
        description !== profile.description;

    return (
        <List sx={{ pt: 0 }}>
            <ListSubheader component="div">{t`Profile`}</ListSubheader>

            {/* Live preview */}
            <Box sx={{ px: 2, pb: 2 }}>
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box
                        sx={{
                            height: 96,
                            width: '100%',
                            backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                            bgcolor: bannerUrl ? undefined : 'primary.main',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <Stack direction="row" spacing={2} sx={{ px: 2, pb: 2, alignItems: 'flex-end' }}>
                        <Box
                            sx={{
                                width: PREVIEW_AVATAR_SIZE,
                                height: PREVIEW_AVATAR_SIZE,
                                borderRadius: 3,
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: 3,
                                borderColor: 'background.paper',
                                bgcolor: 'action.hover',
                                boxShadow: 2,
                                mt: `-${PREVIEW_AVATAR_SIZE / 2}px`,
                            }}
                        >
                            {avatarUrl ? (
                                <Box
                                    component="img"
                                    src={avatarUrl}
                                    alt={displayName || profile.displayName}
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
                                    }}
                                >
                                    <AccountCircleIcon sx={{ fontSize: 40 }} color="disabled" />
                                </Stack>
                            )}
                        </Box>
                        <Box sx={{ pb: 0.5, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                {displayName || profile.displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                @{profile.username}
                            </Typography>
                        </Box>
                    </Stack>
                    <Divider />
                    <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
                        <Chip size="small" icon={<BadgeOutlinedIcon />} label={profile.role} variant="outlined" />
                        <Chip
                            size="small"
                            icon={<CollectionsBookmarkOutlinedIcon />}
                            label={t`${profile.favoriteMangaIds.length} favorites`}
                            variant="outlined"
                        />
                    </Stack>
                </Paper>
            </Box>

            <Stack spacing={2} sx={{ px: 2, pb: 2 }}>
                <TextField
                    label={t`Display name`}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    fullWidth
                />
                <TextField
                    label={t`Avatar URL`}
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://…"
                    fullWidth
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <ImageOutlinedIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <TextField
                    label={t`Banner URL`}
                    value={bannerUrl}
                    onChange={(event) => setBannerUrl(event.target.value)}
                    placeholder="https://…"
                    fullWidth
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LinkIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Box>
                    <Button
                        variant="contained"
                        disableElevation
                        onClick={save}
                        disabled={isSaving || !dirty}
                        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
                        sx={{ borderRadius: 999, px: 3 }}
                    >
                        {isSaving ? t`Saving…` : t`Save profile`}
                    </Button>
                </Box>
            </Stack>
            <TextSetting
                settingName={t`About`}
                value={description}
                handleChange={setDescription}
                disabled={isSaving}
                dialogDescription={t`Describe yourself to other users.`}
            />
            <Divider sx={{ my: 1 }} />
            <Box sx={{ px: 2, pb: 2 }}>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={() => {
                        logout().catch(() => {});
                    }}
                    sx={{ borderRadius: 999, px: 3 }}
                >
                    {t`Log out`}
                </Button>
            </Box>
        </List>
    );
}
