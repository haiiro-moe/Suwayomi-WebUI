/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
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
    const [roleId, setRoleId] = useState<number | undefined>();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRoleId, setEditRoleId] = useState<number | undefined>();
    const [editEnabled, setEditEnabled] = useState(true);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const { data, loading, error, refetch } = requestManager.useGetAdminUsers();
    const { data: rolesData, loading: rolesLoading } = requestManager.useGetAdminRoles();
    const [createUser] = requestManager.useCreateUser();
    const [updateUser] = requestManager.useUpdateUser();
    const [deleteUser] = requestManager.useDeleteUser();

    if ((loading || rolesLoading) && !data) {
        return <LoadingPlaceholder />;
    }
    if (error || !data || !rolesData) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load administration`}
                messageExtra={error ? getErrorMessage(error) : undefined}
                retry={() => refetch()}
            />
        );
    }

    const submit = async () => {
        if (!username || !password || !displayName || roleId === undefined) {
            return;
        }
        try {
            await createUser({ variables: { input: { username, password, displayName, roleId } } });
            setUsername('');
            setPassword('');
            setDisplayName('');
            setRoleId(undefined);
        } catch (saveError) {
            makeToast(t`Failed to create user`, 'error', getErrorMessage(saveError));
        }
    };

    const startEdit = (user: (typeof data.users)[number]) => {
        setEditingId(user.id);
        setEditDisplayName(user.displayName);
        setEditRoleId(rolesData.roles.find((role) => role.name === user.role)?.id);
        setEditEnabled(true);
        setEditPassword('');
    };

    const saveEdit = async () => {
        if (editingId === null || editRoleId === undefined) {
            return;
        }
        try {
            await updateUser({
                variables: {
                    input: {
                        id: editingId,
                        displayName: editDisplayName,
                        password: editPassword || undefined,
                        enabled: editEnabled,
                        roleId: editRoleId,
                    },
                },
            });
            setEditingId(null);
        } catch (saveError) {
            makeToast(t`Failed to update user`, 'error', getErrorMessage(saveError));
        }
    };

    const remove = async (id: number) => {
        try {
            await deleteUser({ variables: { input: { userId: id } } });
            setPendingDeleteId(null);
        } catch (deleteError) {
            makeToast(t`Failed to delete user`, 'error', getErrorMessage(deleteError));
        }
    };

    const requestDelete = (id: number) => setPendingDeleteId(id);

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            {pendingDeleteId !== null && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <span>{t`Delete this user?`}</span>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => remove(pendingDeleteId)}
                    >{t`Confirm`}</Button>
                    <Button onClick={() => setPendingDeleteId(null)}>{t`Cancel`}</Button>
                </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <ManageAccountsIcon />
                <strong>{t`User administration`}</strong>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField label={t`Username`} value={username} onChange={(event) => setUsername(event.target.value)} />
                <TextField
                    label={t`Display name`}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                />
                <TextField
                    label={t`Password`}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <select
                    aria-label={t`Role`}
                    value={roleId ?? ''}
                    onChange={(event) => setRoleId(event.target.value ? Number(event.target.value) : undefined)}
                >
                    <option value="">{t`Select role`}</option>
                    {rolesData.roles.map((role) => (
                        <option key={role.id} value={role.id}>
                            {role.name}
                        </option>
                    ))}
                </select>
                <Button startIcon={<AddIcon />} variant="contained" onClick={submit}>{t`Create`}</Button>
            </Stack>
            <List>
                {data.users.map((user) => (
                    <Box key={user.id}>
                        <ListItem
                            component="div"
                            secondaryAction={
                                <Stack direction="row">
                                    <Button startIcon={<EditIcon />} onClick={() => startEdit(user)}>{t`Edit`}</Button>
                                    <Button
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => requestDelete(user.id)}
                                    >{t`Delete`}</Button>
                                </Stack>
                            }
                        >
                            <ListItemText primary={user.displayName} secondary={`@${user.username} · ${user.role}`} />
                        </ListItem>
                        {editingId === user.id && (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ p: 2 }}>
                                <TextField
                                    label={t`Display name`}
                                    value={editDisplayName}
                                    onChange={(event) => setEditDisplayName(event.target.value)}
                                />
                                <TextField
                                    label={t`New password`}
                                    type="password"
                                    value={editPassword}
                                    onChange={(event) => setEditPassword(event.target.value)}
                                />
                                <select
                                    aria-label={t`Role`}
                                    value={editRoleId ?? ''}
                                    onChange={(event) =>
                                        setEditRoleId(event.target.value ? Number(event.target.value) : undefined)
                                    }
                                >
                                    {rolesData.roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={editEnabled}
                                            onChange={(event) => setEditEnabled(event.target.checked)}
                                        />
                                    }
                                    label={t`Enabled`}
                                />
                                <Button variant="contained" onClick={saveEdit}>{t`Save`}</Button>
                            </Stack>
                        )}
                    </Box>
                ))}
            </List>
        </Stack>
    );
}
