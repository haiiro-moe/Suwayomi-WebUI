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
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
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
    const [roleName, setRoleName] = useState('');
    const [roleDescription, setRoleDescription] = useState('');
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [permissionSearch, setPermissionSearch] = useState('');
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const { data, loading, error, refetch } = requestManager.useGetAdminUsers();
    const { data: rolesData, loading: rolesLoading } = requestManager.useGetAdminRoles();
    const [createUser] = requestManager.useCreateUser();
    const [updateUser] = requestManager.useUpdateUser();
    const [deleteUser] = requestManager.useDeleteUser();
    const [createRole] = requestManager.useCreateRole();
    const [updateRole] = requestManager.useUpdateRole();
    const [deleteRole] = requestManager.useDeleteRole();

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

    const saveRole = async () => {
        if (!roleName.trim()) {
            return;
        }
        try {
            if (editingRoleId === null) {
                await createRole({
                    variables: {
                        input: { name: roleName, description: roleDescription, permissions: rolePermissions },
                    },
                });
            } else {
                await updateRole({
                    variables: {
                        input: {
                            roleId: editingRoleId,
                            name: roleName,
                            description: roleDescription,
                            permissions: rolePermissions,
                        },
                    },
                });
            }
            setRoleName('');
            setRoleDescription('');
            setRolePermissions([]);
            setEditingRoleId(null);
        } catch (saveError) {
            makeToast(t`Failed to save role`, 'error', getErrorMessage(saveError));
        }
    };

    const startRoleEdit = (role: (typeof rolesData.roles)[number]) => {
        if (role.name === 'owner') {
            return;
        }
        setEditingRoleId(role.id);
        setRoleName(role.name);
        setRoleDescription(role.description);
        setRolePermissions(role.permissions);
        setPermissionSearch('');
    };

    const resetRoleEditor = () => {
        setRoleName('');
        setRoleDescription('');
        setRolePermissions([]);
        setEditingRoleId(null);
        setPermissionSearch('');
    };

    const removeRole = async (adminRoleId: number) => {
        try {
            await deleteRole({ variables: { input: { roleId: adminRoleId } } });
        } catch (deleteError) {
            makeToast(t`Failed to delete role`, 'error', getErrorMessage(deleteError));
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
            <Stack spacing={2}>
                <Box>
                    <Typography variant="h6">{t`Roles`}</Typography>
                    <Typography color="text.secondary" variant="body2">
                        {editingRoleId === null
                            ? t`Create a role and choose the permissions it should have.`
                            : t`Edit role details and permissions.`}
                    </Typography>
                </Box>
                <Card variant="outlined">
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth
                                    label={t`Role name`}
                                    value={roleName}
                                    onChange={(event) => setRoleName(event.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label={t`Description`}
                                    value={roleDescription}
                                    onChange={(event) => setRoleDescription(event.target.value)}
                                />
                            </Stack>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                sx={{ justifyContent: 'space-between' }}
                                spacing={1}
                            >
                                <Box>
                                    <Typography variant="subtitle1">{t`Permissions`}</Typography>
                                    <Typography color="text.secondary" variant="body2">
                                        {t`${rolePermissions.length} selected`}
                                    </Typography>
                                </Box>
                                <TextField
                                    label={t`Search permissions`}
                                    value={permissionSearch}
                                    onChange={(event) => setPermissionSearch(event.target.value)}
                                    size="small"
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Stack>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 1.5,
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                                }}
                            >
                                {Object.entries(
                                    rolesData.permissionNodes
                                        .filter((permission) =>
                                            permission.toLowerCase().includes(permissionSearch.trim().toLowerCase()),
                                        )
                                        .reduce<Record<string, string[]>>((groups, permission) => {
                                            const group = permission.split(/[.:/]/, 1)[0] || t`Other`;
                                            return { ...groups, [group]: [...(groups[group] ?? []), permission] };
                                        }, {}),
                                ).map(([group, permissions]) => (
                                    <Paper key={group} variant="outlined" sx={{ p: 1.5 }}>
                                        <Typography sx={{ fontWeight: 'bold' }} variant="subtitle2">
                                            {group}
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Stack>
                                            {permissions.map((permission) => (
                                                <FormControlLabel
                                                    key={permission}
                                                    control={
                                                        <Checkbox
                                                            checked={rolePermissions.includes(permission)}
                                                            onChange={(event) =>
                                                                setRolePermissions((current) =>
                                                                    event.target.checked
                                                                        ? [...current, permission]
                                                                        : current.filter(
                                                                              (selected) => selected !== permission,
                                                                          ),
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label={permission}
                                                />
                                            ))}
                                        </Stack>
                                    </Paper>
                                ))}
                            </Box>
                        </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                        <Button onClick={resetRoleEditor}>{editingRoleId === null ? t`Reset` : t`Cancel`}</Button>
                        <Button variant="contained" onClick={saveRole} disabled={!roleName.trim()}>
                            {editingRoleId === null ? t`Create role` : t`Save role`}
                        </Button>
                    </CardActions>
                </Card>
                <Stack spacing={1}>
                    <List>
                        {rolesData.roles.map((role) => (
                            <Card key={role.id} variant="outlined">
                                <CardContent sx={{ pb: 1 }}>
                                    <Typography variant="subtitle1">{role.name}</Typography>
                                    <Typography color="text.secondary" variant="body2">
                                        {role.description || role.permissions.join(', ')}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                    <Button
                                        startIcon={<EditIcon />}
                                        onClick={() => startRoleEdit(role)}
                                        disabled={role.name === 'owner'}
                                    >
                                        {role.name === 'owner' ? t`Protected` : t`Edit`}
                                    </Button>
                                    {role.name !== 'owner' && (
                                        <Button
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => removeRole(role.id)}
                                        >{t`Delete`}</Button>
                                    )}
                                </CardActions>
                            </Card>
                        ))}
                    </List>
                </Stack>
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
