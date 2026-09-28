/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';

type AccessRow = {
    categoryId: number;
    canRead: boolean;
    canEdit: boolean;
};

type Category = { id: number; name: string };
type Role = { id: number; name: string };
type User = { id: number; displayName: string; username: string; role: string };

type AccessChange = (categoryIds: number[], canRead: boolean, canEdit: boolean) => Promise<void>;

const OWNER_ROLE = 'owner';

const getRow = (access: readonly AccessRow[] | undefined, categoryId: number): AccessRow =>
    access?.find((row) => row.categoryId === categoryId) ?? { categoryId, canRead: false, canEdit: false };

const COLUMN_SX = { width: 72, display: 'flex', justifyContent: 'center' } as const;
const ROW_SX = { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 1, alignItems: 'center' } as const;

function AccessMatrix({
    categories,
    access,
    inherited,
    inheritedLabel,
    onChange,
}: {
    categories: readonly Category[];
    access: readonly AccessRow[];
    /** access that is granted elsewhere (e.g. by the role) and can't be removed here */
    inherited?: readonly AccessRow[];
    inheritedLabel?: string;
    onChange: AccessChange;
}) {
    const { t } = useLingui();

    const effective = (categoryId: number) => {
        const own = getRow(access, categoryId);
        const fromRole = getRow(inherited, categoryId);
        return {
            canRead: own.canRead || fromRole.canRead,
            canEdit: own.canEdit || fromRole.canEdit,
            readInherited: fromRole.canRead,
            editInherited: fromRole.canEdit,
            own,
        };
    };

    const rows = categories.map((category) => ({ category, ...effective(category.id) }));
    const readCount = rows.filter((row) => row.canRead).length;
    const editCount = rows.filter((row) => row.canEdit).length;

    const toggleAllRead = () => {
        if (readCount === rows.length) {
            // removes read and edit access of everything that isn't inherited
            return onChange(
                rows.filter((row) => row.own.canRead).map((row) => row.category.id),
                false,
                false,
            );
        }
        return onChange(
            rows.filter((row) => !row.canRead).map((row) => row.category.id),
            true,
            false,
        );
    };

    const toggleAllEdit = () => {
        if (editCount === rows.length) {
            return onChange(
                rows.filter((row) => row.own.canEdit).map((row) => row.category.id),
                true,
                false,
            );
        }
        return onChange(
            rows.filter((row) => !row.canEdit).map((row) => row.category.id),
            true,
            true,
        );
    };

    const withInheritedTooltip = (isInherited: boolean, checkbox: React.ReactElement) =>
        isInherited && inheritedLabel ? (
            <Tooltip title={inheritedLabel}>
                <span>{checkbox}</span>
            </Tooltip>
        ) : (
            checkbox
        );

    if (categories.length === 0) {
        return <Typography color="text.secondary">{t`No categories found.`}</Typography>;
    }

    return (
        <Box>
            <Box sx={{ ...ROW_SX, px: 2, pb: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography color="text.secondary" variant="body2">
                    {t`Category`}
                </Typography>
                <Stack sx={{ ...COLUMN_SX, alignItems: 'center', flexDirection: 'column' }}>
                    <Typography color="text.secondary" variant="body2">
                        {t`Read`}
                    </Typography>
                    <Checkbox
                        size="small"
                        aria-label={t`Toggle read access for all categories`}
                        checked={readCount === rows.length}
                        indeterminate={readCount > 0 && readCount < rows.length}
                        onChange={toggleAllRead}
                    />
                </Stack>
                <Stack sx={{ ...COLUMN_SX, alignItems: 'center', flexDirection: 'column' }}>
                    <Typography color="text.secondary" variant="body2">
                        {t`Edit`}
                    </Typography>
                    <Checkbox
                        size="small"
                        aria-label={t`Toggle edit access for all categories`}
                        checked={editCount === rows.length}
                        indeterminate={editCount > 0 && editCount < rows.length}
                        onChange={toggleAllEdit}
                    />
                </Stack>
            </Box>
            {rows.map(({ category, canRead, canEdit, readInherited, editInherited, own }) => (
                <Box key={category.id} sx={{ ...ROW_SX, px: 2, py: 0.25 }}>
                    <Typography>{category.name}</Typography>
                    <Box sx={COLUMN_SX}>
                        {withInheritedTooltip(
                            readInherited,
                            <Checkbox
                                aria-label={`${t`Read`}: ${category.name}`}
                                checked={canRead}
                                disabled={readInherited}
                                // removing read access also removes edit access
                                onChange={(event) =>
                                    onChange([category.id], event.target.checked, event.target.checked && own.canEdit)
                                }
                            />,
                        )}
                    </Box>
                    <Box sx={COLUMN_SX}>
                        {withInheritedTooltip(
                            editInherited,
                            <Checkbox
                                aria-label={`${t`Edit`}: ${category.name}`}
                                checked={canEdit}
                                disabled={editInherited}
                                // edit access implies read access
                                onChange={(event) =>
                                    onChange([category.id], event.target.checked || own.canRead, event.target.checked)
                                }
                            />,
                        )}
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

function RoleAccess({ roles, categories }: { roles: readonly Role[]; categories: readonly Category[] }) {
    const { t } = useLingui();
    const editableRoles = roles.filter((role) => role.name !== OWNER_ROLE);
    const [roleId, setRoleId] = useState<number | undefined>(editableRoles[0]?.id);
    const { data, loading, refetch } = requestManager.useGetRoleCategoryAccess(roleId);
    const [setRoleCategoryAccess] = requestManager.useSetRoleCategoryAccess();

    if (editableRoles.length === 0) {
        return <Typography color="text.secondary">{t`Create a role first.`}</Typography>;
    }

    const update: AccessChange = async (categoryIds, canRead, canEdit) => {
        if (roleId === undefined || categoryIds.length === 0) {
            return;
        }
        try {
            await setRoleCategoryAccess({ variables: { input: { roleId, categoryIds, canRead, canEdit } } });
            await refetch();
        } catch (saveError) {
            makeToast(t`Failed to update category access`, 'error', getErrorMessage(saveError));
        }
    };

    return (
        <Stack spacing={2}>
            <TextField
                select
                fullWidth
                label={t`Role`}
                value={roleId ?? ''}
                onChange={(event) => setRoleId(event.target.value ? Number(event.target.value) : undefined)}
            >
                {editableRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                        {role.name}
                    </MenuItem>
                ))}
            </TextField>
            {loading && !data ? (
                <LoadingPlaceholder />
            ) : (
                <AccessMatrix categories={categories} access={data?.roleCategoryAccess ?? []} onChange={update} />
            )}
        </Stack>
    );
}

function UserAccess({
    users,
    roles,
    categories,
}: {
    users: readonly User[];
    roles: readonly Role[];
    categories: readonly Category[];
}) {
    const { t } = useLingui();
    const editableUsers = users.filter((user) => user.role !== OWNER_ROLE);
    const [userId, setUserId] = useState<number | undefined>(editableUsers[0]?.id);
    const user = editableUsers.find((candidate) => candidate.id === userId);
    const roleId = roles.find((role) => role.name === user?.role)?.id;
    const { data, loading, refetch } = requestManager.useGetCategoryAccess(userId);
    const { data: roleData, loading: roleLoading } = requestManager.useGetRoleCategoryAccess(roleId);
    const [setCategoryAccess] = requestManager.useSetCategoryAccess();

    if (editableUsers.length === 0) {
        return <Typography color="text.secondary">{t`No users found.`}</Typography>;
    }

    const update: AccessChange = async (categoryIds, canRead, canEdit) => {
        if (userId === undefined) {
            return;
        }
        try {
            await Promise.all(
                categoryIds.map((categoryId) =>
                    setCategoryAccess({ variables: { input: { userId, categoryId, canRead, canEdit } } }),
                ),
            );
            await refetch();
        } catch (saveError) {
            makeToast(t`Failed to update category access`, 'error', getErrorMessage(saveError));
        }
    };

    const roleName = user?.role ?? '';

    return (
        <Stack spacing={2}>
            <TextField
                select
                fullWidth
                label={t`User`}
                value={userId ?? ''}
                onChange={(event) => setUserId(event.target.value ? Number(event.target.value) : undefined)}
                helperText={t`Grants from the role "${roleName}" are always applied and can only be changed on the role.`}
            >
                {editableUsers.map((candidate) => (
                    <MenuItem key={candidate.id} value={candidate.id}>
                        {`${candidate.displayName} (@${candidate.username}) · ${candidate.role}`}
                    </MenuItem>
                ))}
            </TextField>
            {(loading && !data) || (roleLoading && !roleData) ? (
                <LoadingPlaceholder />
            ) : (
                <AccessMatrix
                    categories={categories}
                    access={data?.categoryAccess ?? []}
                    inherited={roleData?.roleCategoryAccess ?? []}
                    inheritedLabel={t`Granted by the role "${roleName}"`}
                    onChange={update}
                />
            )}
        </Stack>
    );
}

export function CategoryAccessSection({
    users,
    roles,
    categories,
}: {
    users: readonly User[];
    roles: readonly Role[];
    categories: readonly Category[];
}) {
    const { t } = useLingui();
    const [mode, setMode] = useState<'role' | 'user'>('role');

    return (
        <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
            <CardContent>
                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                    >
                        <Box>
                            <Typography variant="h6">{t`Category access`}</Typography>
                            <Typography color="text.secondary" variant="body2">
                                {mode === 'role'
                                    ? t`Choose which categories each role can see and edit. Applies to every user with the role.`
                                    : t`Give single users access on top of what their role already allows.`}
                            </Typography>
                        </Box>
                        <ToggleButtonGroup
                            exclusive
                            size="small"
                            value={mode}
                            onChange={(_, value) => value && setMode(value)}
                        >
                            <ToggleButton value="role">{t`Roles`}</ToggleButton>
                            <ToggleButton value="user">{t`Individual users`}</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                    {mode === 'role' ? (
                        <RoleAccess roles={roles} categories={categories} />
                    ) : (
                        <UserAccess users={users} roles={roles} categories={categories} />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
