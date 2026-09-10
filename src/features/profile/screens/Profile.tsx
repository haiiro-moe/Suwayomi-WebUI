/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
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

    if (loading && !data) {
        return <LoadingPlaceholder />;
    }

    if (error || !data?.currentUserProfile) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load profile`}
                messageExtra={error ? getErrorMessage(error) : undefined}
                retry={() => refetch().catch(defaultPromiseErrorHandler('Profile::refetch'))}
            />
        );
    }

    const profile = data.currentUserProfile;
    const updateDescription = async (description: string) => {
        setIsSaving(true);
        try {
            await updateProfile({ variables: { input: { description } } });
        } catch (saveError) {
            makeToast(t`Failed to save profile`, 'error', getErrorMessage(saveError));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <List sx={{ pt: 0 }}>
            <ListSubheader component="div">{t`Profile`}</ListSubheader>
            <ListItem>
                <ListItemIcon>
                    <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText primary={profile.displayName} secondary={`@${profile.username}`} />
            </ListItem>
            <ListItem>
                <ListItemText primary={t`Role`} secondary={profile.role} />
            </ListItem>
            <ListItem>
                <ListItemText primary={t`Favorites`} secondary={profile.favoriteMangaIds.length.toString()} />
            </ListItem>
            <TextSetting
                settingName={t`About`}
                value={profile.description}
                handleChange={updateDescription}
                disabled={isSaving}
                dialogDescription={t`Describe yourself to other users.`}
            />
        </List>
    );
}
