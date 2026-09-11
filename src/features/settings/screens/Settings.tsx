/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import List from '@mui/material/List';
import BackupIcon from '@mui/icons-material/Backup';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CollectionsOutlinedBookmarkIcon from '@mui/icons-material/CollectionsBookmarkOutlined';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import DnsIcon from '@mui/icons-material/Dns';
import WebIcon from '@mui/icons-material/Web';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import DevicesIcon from '@mui/icons-material/Devices';
import PaletteIcon from '@mui/icons-material/Palette';
import HistoryIcon from '@mui/icons-material/History';
import ImageIcon from '@mui/icons-material/Image';
import { useLingui } from '@lingui/react/macro';
import { ListItemLink } from '@/base/components/lists/ListItemLink.tsx';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { usePermissions } from '@/features/authentication/usePermissions.ts';

export function Settings() {
    const { t } = useLingui();
    const permissions = usePermissions();

    useAppTitle(t`Settings`);

    const canEdit = permissions.has('settings.edit');
    const canSee = (permission: string) => canEdit && permissions.has(permission);

    return (
        <List sx={{ padding: 0 }}>
            {canSee('settings.misc') && (
                <ListItemLink to={AppRoutes.settings.children.appearance.path}>
                    <ListItemIcon>
                        <PaletteIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Appearance`} />
                </ListItemLink>
            )}
            {canSee('settings.misc') && (
                <ListItemLink to={AppRoutes.settings.children.reader.path}>
                    <ListItemIcon>
                        <AutoStoriesIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Reader`} />
                </ListItemLink>
            )}
            {canSee('settings.library_updates') && (
                <ListItemLink to={AppRoutes.settings.children.library.path}>
                    <ListItemIcon>
                        <CollectionsOutlinedBookmarkIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Library`} />
                </ListItemLink>
            )}
            {canSee('settings.downloader') && (
                <ListItemLink to={AppRoutes.settings.children.download.path}>
                    <ListItemIcon>
                        <GetAppOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Downloads`} />
                </ListItemLink>
            )}
            {canSee('settings.downloader') && (
                <ListItemLink to={AppRoutes.settings.children.images.path}>
                    <ListItemIcon>
                        <ImageIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Images`} />
                </ListItemLink>
            )}
            {canSee('settings.backup') && (
                <ListItemLink to={AppRoutes.settings.children.backup.path}>
                    <ListItemIcon>
                        <BackupIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Backup`} />
                </ListItemLink>
            )}
            {canSee('settings.extension') && (
                <ListItemLink to={AppRoutes.settings.children.browse.path}>
                    <ListItemIcon>
                        <ExploreOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Browse`} />
                </ListItemLink>
            )}
            {canSee('settings.misc') && (
                <ListItemLink to={AppRoutes.settings.children.history.path}>
                    <ListItemIcon>
                        <HistoryIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`History`} />
                </ListItemLink>
            )}
            {canSee('settings.misc') && (
                <ListItemLink to={AppRoutes.settings.children.device.path}>
                    <ListItemIcon>
                        <DevicesIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Device`} />
                </ListItemLink>
            )}
            {canSee('settings.web_ui') && (
                <ListItemLink to={AppRoutes.settings.children.webui.path}>
                    <ListItemIcon>
                        <WebIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`WebUI`} />
                </ListItemLink>
            )}
            {canSee('settings.network') && (
                <ListItemLink to={AppRoutes.settings.children.server.path}>
                    <ListItemIcon>
                        <DnsIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Server`} />
                </ListItemLink>
            )}
        </List>
    );
}
