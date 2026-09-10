/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

export function Admin() {
    const { t } = useLingui();
    useAppTitle(t`Administration`);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const { data, loading, error, refetch } = requestManager.useGetAdminUsers();
    const [createUser] = requestManager.useCreateUser();
    const [deleteUser] = requestManager.useDeleteUser();

    if (loading && !data) {return <LoadingPlaceholder />;}
    if (error || !data) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load administration`}
                messageExtra={error ? getErrorMessage(error) : undefined}
                retry={() => refetch()}
            />
        );
    }

    const submit = async () => {
        if (!username || !password || !displayName) {return;}
        try {
            await createUser({ variables: { input: { username, password, displayName } } });
            setUsername('');
            setPassword('');
            setDisplayName('');
        } catch (saveError) {
            makeToast(t`Failed to create user`, 'error', getErrorMessage(saveError));
        }
    };

    const remove = async (id: number) => {
        try {
            await deleteUser({ variables: { input: { userId: id } } });
        } catch (deleteError) {
            makeToast(t`Failed to delete user`, 'error', getErrorMessage(deleteError));
        }
    };

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <ManageAccountsIcon />
                <strong>{t`User administration`}</strong>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <input
                    aria-label={t`Username`}
                    placeholder={t`Username`}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
                <input
                    aria-label={t`Display name`}
                    placeholder={t`Display name`}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                />
                <input
                    aria-label={t`Password`}
                    placeholder={t`Password`}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <Button startIcon={<AddIcon />} variant="contained" onClick={submit}>{t`Create`}</Button>
            </Stack>
            <List>
                {data.users.map((user) => (
                    <ListItem
                        component="div"
                        key={user.id}
                        secondaryAction={
                            <Button
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => remove(user.id)}
                            >{t`Delete`}</Button>
                        }
                    >
                        <ListItemText primary={user.displayName} secondary={`@${user.username} · ${user.role}`} />
                    </ListItem>
                ))}
            </List>
        </Stack>
    );
}
