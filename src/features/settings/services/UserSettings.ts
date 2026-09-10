/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';

const USER_SETTING_KEYS = [
    'locale',
    'appTheme',
    'themeMode',
    'shouldUsePureBlackMode',
    'mangaThumbnailBackdrop',
    'mangaDynamicColorSchemes',
    'mangaGridItemWidth',
    'hideHistory',
    'updateProgressAfterReading',
    'updateProgressManualMarkRead',
] as const;

export type UserSettingKey = (typeof USER_SETTING_KEYS)[number];
export type UserSettings = Partial<Record<UserSettingKey, string>>;

const isUserSettingKey = (key: string): key is UserSettingKey => (USER_SETTING_KEYS as readonly string[]).includes(key);

export const parseUserSettings = (settings?: readonly { key: string; value: string }[]): UserSettings =>
    Object.fromEntries(
        (settings ?? []).filter(({ key }) => isUserSettingKey(key)).map(({ key, value }) => [key, value]),
    );

export const useUserSettings = () => {
    const request = requestManager.useGetUserSettings();
    const [settings, setSettings] = useState<UserSettings>({});

    useEffect(() => {
        if (request.data?.userSettings) {
            setSettings(parseUserSettings(request.data.userSettings));
        }
    }, [request.data?.userSettings]);

    const [setUserSettings] = requestManager.useSetUserSettings();
    const update = useCallback(
        async (key: UserSettingKey, value: string) => {
            setSettings((current) => ({ ...current, [key]: value }));
            await setUserSettings({ variables: { input: { settings: [{ key, value }] } } });
        },
        [setUserSettings],
    );

    return useMemo(() => ({ ...request, settings, update }), [request, settings, update]);
};
