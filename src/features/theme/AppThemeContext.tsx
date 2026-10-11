/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Direction } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import type { AppTheme } from '@/features/theme/services/AppThemes.ts';
import { getTheme } from '@/features/theme/services/AppThemes.ts';
import { useMetadataServerSettings } from '@/features/settings/services/ServerSettingsMetadata.ts';
import { useLocalStorage } from '@/base/hooks/useStorage.tsx';
import { MUI_THEME_MODE_KEY } from '@/lib/mui/MUI.constants.ts';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';
import { createAndSetTheme } from '@/features/theme/services/ThemeCreator.ts';
import { AppStorage } from '@/lib/storage/AppStorage.ts';
import { DIRECTION_TO_CACHE } from '@/features/theme/ThemeDirectionCache.ts';
import type { TAppThemeContext } from '@/features/theme/AppTheme.types.ts';
import { ThemeMode } from '@/features/theme/AppTheme.types.ts';
import { getLanguageReadingDirection } from '@/lib/ISOLanguageUtil.ts';
import { loadCatalog } from '@/i18n';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { useUserSettings } from '@/features/settings/services/UserSettings.ts';

const parseBooleanSetting = (value: string | undefined, fallback: boolean) =>
    value === undefined ? fallback : value === 'true';

const parseStringSetting = <T extends string>(value: string | undefined, fallback: T): T => (value ?? fallback) as T;

export const AppThemeContext = React.createContext<TAppThemeContext>({
    appTheme: 'default',
    setAppTheme: (): void => {},
    themeMode: ThemeMode.SYSTEM,
    setThemeMode: (): void => {},
    shouldUsePureBlackMode: false,
    setShouldUsePureBlackMode: (): void => {},
    dynamicColor: null,
    setDynamicColor: (): void => {},
});

export const useAppThemeContext = () => useContext(AppThemeContext);

export const AppThemeContextProvider = ({ children }: { children: ReactNode }) => {
    const {
        request: metadataServerSettingsRequest,
        settings: {
            appTheme: serverAppTheme,
            themeMode: serverThemeMode,
            shouldUsePureBlackMode: serverPureBlack,
            customThemes,
            locale,
        },
    } = useMetadataServerSettings();
    const userSettings = useUserSettings();
    const { settings: userScopedSettings } = userSettings;
    const resolvedAppTheme = parseStringSetting(userScopedSettings.appTheme, serverAppTheme);
    const resolvedThemeMode = parseStringSetting(userScopedSettings.themeMode, serverThemeMode);
    const resolvedPureBlack = parseBooleanSetting(userScopedSettings.shouldUsePureBlackMode, serverPureBlack);
    const [localAppTheme, setLocalAppTheme] = useLocalStorage<AppTheme>(
        'appTheme',
        getTheme(resolvedAppTheme, customThemes),
    );
    const [localThemeMode, setLocalThemeMode] = useLocalStorage(MUI_THEME_MODE_KEY, resolvedThemeMode);

    const directionRef = useRef<Direction>('ltr');

    const [systemThemeMode, setSystemThemeMode] = useState<ThemeMode>(MediaQuery.getSystemThemeMode());
    const [dynamicColor, setDynamicColor] = useState<TAppThemeContext['dynamicColor']>(null);

    const areMetadataServerSettingsReady =
        !metadataServerSettingsRequest.loading && !metadataServerSettingsRequest.error;

    const appTheme = areMetadataServerSettingsReady ? resolvedAppTheme : localAppTheme.id;
    const actualThemeMode = areMetadataServerSettingsReady ? resolvedThemeMode : localThemeMode;
    const shouldUsePureBlackMode = resolvedPureBlack;
    const currentDirection = getLanguageReadingDirection(locale);

    const appThemeContext = useMemo(
        () =>
            ({
                appTheme,
                setAppTheme: (value) => userSettings.update('appTheme', value),
                themeMode: actualThemeMode,
                setThemeMode: (value) => userSettings.update('themeMode', value),
                shouldUsePureBlackMode,
                setShouldUsePureBlackMode: (value) => userSettings.update('shouldUsePureBlackMode', String(value)),
                dynamicColor,
                setDynamicColor,
            }) satisfies TAppThemeContext,
        [actualThemeMode, shouldUsePureBlackMode, appTheme, dynamicColor, userSettings.update],
    );

    const theme = useMemo(
        () =>
            createAndSetTheme(
                actualThemeMode as ThemeMode,
                getTheme(appTheme, { [localAppTheme.id]: localAppTheme, ...customThemes }),
                shouldUsePureBlackMode,
                currentDirection,
                dynamicColor,
            ),
        [
            actualThemeMode,
            currentDirection,
            systemThemeMode,
            shouldUsePureBlackMode,
            appTheme,
            customThemes,
            dynamicColor,
        ],
    );

    useLayoutEffect(() => {
        const unsubscribe = MediaQuery.listenToSystemThemeChange(setSystemThemeMode);

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!areMetadataServerSettingsReady) {
            return;
        }

        loadCatalog(locale).catch(defaultPromiseErrorHandler('AppThemeContextProvider::loadCatalog'));
    }, [areMetadataServerSettingsReady]);

    useEffect(() => {
        if (!areMetadataServerSettingsReady) {
            return;
        }

        if (resolvedAppTheme !== localAppTheme.id) {
            setLocalAppTheme(getTheme(resolvedAppTheme, customThemes));
        }

        if (resolvedThemeMode !== localThemeMode) {
            setLocalThemeMode(resolvedThemeMode);
        }
    }, [
        resolvedAppTheme,
        localAppTheme,
        resolvedThemeMode,
        localThemeMode,
        customThemes,
        setLocalAppTheme,
        setLocalThemeMode,
    ]);

    useEffect(() => {
        // The set background color is not necessary anymore, since the theme has been loaded
        document.documentElement.style.backgroundColor = '';
        const themeBackgroundColor = theme.palette.background.default;

        AppStorage.local.setItem('theme_background', themeBackgroundColor);
        // android chromium-based browser/pwa background color (e.g. top status bar and navigation bar) will change dynamically based on meta theme-color
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.setAttribute('name', 'theme-color');
            document.head.appendChild(themeColorMeta);
        }
        if (themeColorMeta.getAttribute('content') !== themeBackgroundColor) {
            themeColorMeta.setAttribute('content', themeBackgroundColor);
        }
    }, [theme.palette.background.default]);

    if (directionRef.current !== currentDirection) {
        document.dir = currentDirection;
        directionRef.current = currentDirection;
    }

    return (
        <AppThemeContext.Provider value={appThemeContext}>
            <CacheProvider value={DIRECTION_TO_CACHE[currentDirection]}>
                <ThemeProvider theme={theme}>{children}</ThemeProvider>
            </CacheProvider>
        </AppThemeContext.Provider>
    );
};
