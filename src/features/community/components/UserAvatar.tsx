/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Avatar from '@mui/material/Avatar';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Deterministically picks one of the theme's own palette colors for a user's letter-avatar
 * background, so avatars stay varied but never introduce a color outside the active theme.
 */
function paletteColorForSeed(theme: Theme, seed: string) {
    const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.dark,
        theme.palette.info.main,
        theme.palette.success.dark,
    ];

    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({
    avatarUrl,
    displayName,
    size = 40,
    sx,
}: {
    avatarUrl?: string | null;
    displayName: string;
    size?: number;
    sx?: SxProps<Theme>;
}) {
    return (
        <Avatar
            src={avatarUrl || undefined}
            alt={displayName}
            sx={[
                {
                    width: size,
                    height: size,
                    fontSize: size * 0.42,
                    fontWeight: 600,
                    bgcolor: avatarUrl ? undefined : (theme) => paletteColorForSeed(theme, displayName || '?'),
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {displayName ? displayName.charAt(0).toUpperCase() : '?'}
        </Avatar>
    );
}
