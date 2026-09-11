/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { useAppThemeContext } from '@/features/theme/AppThemeContext.tsx';
import { getTheme } from '@/features/theme/services/AppThemes.ts';
import { createAndSetTheme } from '@/features/theme/services/ThemeCreator.ts';
import { ThemeMode } from '@/features/theme/AppTheme.types.ts';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';

type ProfileThemeSettings = {
    appTheme?: string | null;
    themeMode?: string | null;
    pureBlackMode?: boolean | null;
};

/**
 * Renders [children] in a nested MUI theme built from the profile owner's theme settings, falling back to the
 * viewer's theme for settings the owner has not customized. Scope is limited to the profile page.
 */
export const ProfileThemeProvider = ({
    settings,
    children,
}: {
    settings: ProfileThemeSettings;
    children: ReactNode;
}) => {
    const viewerContext = useAppThemeContext();
    const {
        appTheme: viewerAppTheme,
        themeMode: viewerThemeMode,
        shouldUsePureBlackMode,
        dynamicColor,
    } = viewerContext;
    const { customThemes } = viewerContext as unknown as {
        customThemes?: Record<string, ReturnType<typeof getTheme>>;
    };

    const hasOverride = !!(settings.appTheme || settings.themeMode || settings.pureBlackMode != null);

    const theme = useMemo(() => {
        if (!hasOverride) {
            return undefined;
        }

        const resolvedMode =
            (settings.themeMode as ThemeMode | undefined) ??
            (viewerThemeMode as ThemeMode | undefined) ??
            ThemeMode.SYSTEM;
        const isDark = MediaQuery.getThemeMode(resolvedMode) === ThemeMode.DARK;
        const pureBlack = settings.pureBlackMode ?? shouldUsePureBlackMode;
        const appTheme = getTheme(settings.appTheme ?? viewerAppTheme, customThemes);

        return createAndSetTheme(resolvedMode, appTheme, pureBlack && isDark, 'ltr', null);
    }, [
        hasOverride,
        settings.appTheme,
        settings.themeMode,
        settings.pureBlackMode,
        viewerAppTheme,
        viewerThemeMode,
        shouldUsePureBlackMode,
        customThemes,
        dynamicColor,
    ]);

    if (!theme) {
        return children;
    }

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
