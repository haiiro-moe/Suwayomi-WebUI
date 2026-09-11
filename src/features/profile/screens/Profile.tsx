/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { TextSetting } from '@/base/components/settings/text/TextSetting.tsx';
import { makeToast } from '@/base/utils/Toast.ts';

export function Profile() {
    const { t } = useLingui();
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
    const [description, setDescription] = useState('');

    const profile = data?.currentUserProfile;
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.displayName);
            setAvatarUrl(profile.avatarUrl ?? '');
            setDescription(profile.description);
        }
    }, [profile?.id, profile?.displayName, profile?.avatarUrl, profile?.description]);

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

    const save = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                variables: {
                    input: {
                        displayName: displayName.trim() || profile.displayName,
                        avatarUrl,
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
        description !== profile.description;

    return (
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
                <ListItemText primary={t`Role`} secondary={profile.role} />
            </ListItem>
            <ListItem>
                <ListItemText primary={t`Favorites`} secondary={t`${profile.favoriteMangaIds.length} manga`} />
            </ListItem>
            <Stack spacing={2} sx={{ p: 2 }}>
                <TextField
                    label={t`Display name`}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                />
                <TextField
                    label={t`Avatar URL`}
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://…"
                />
                <Button variant="contained" onClick={save} disabled={isSaving || !dirty}>{t`Save profile`}</Button>
            </Stack>
            <TextSetting
                settingName={t`About`}
                value={description}
                handleChange={setDescription}
                disabled={isSaving}
                dialogDescription={t`Describe yourself to other users.`}
            />
        </List>
    );
}
