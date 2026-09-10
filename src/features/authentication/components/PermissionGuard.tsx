/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '@/features/authentication/usePermissions.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';

export function PermissionGuard({ permission, children }: { permission: string; children?: ReactNode }) {
    const permissions = usePermissions();

    if (!permissions.has(permission)) {
        return <Navigate to={AppRoutes.root.path} replace />;
    }

    return children ?? <Outlet />;
}
