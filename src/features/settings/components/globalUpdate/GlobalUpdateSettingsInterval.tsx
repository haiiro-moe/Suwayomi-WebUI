/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import { useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { NumberSetting } from '@/base/components/settings/NumberSetting.tsx';
import { getPersistedServerSetting, usePersistedValue } from '@/base/hooks/usePersistedValue.tsx';
import type { ServerSettings } from '@/features/settings/Settings.types.ts';

const DEFAULT_UPDATE_INTERVAL_HOURS = 12;
const MIN_UPDATE_INTERVAL_HOURS = 6;
const MAX_UPDATE_INTERVAL_HOURS = 24 * 31;

const cronToIntervalHours = (cron: string | null | undefined): number => {
    const match = cron?.match(/^0 \*\/(\d+) \* \* \*$/);
    return match ? Number(match[1]) : DEFAULT_UPDATE_INTERVAL_HOURS;
};

export const GlobalUpdateSettingsInterval = ({
    globalUpdateCron,
}: {
    globalUpdateCron: ServerSettings['globalUpdateCron'];
}) => {
    const { t } = useLingui();

    const autoUpdateIntervalHours = cronToIntervalHours(globalUpdateCron);
    const doAutoUpdates = !!globalUpdateCron;
    const [mutateSettings] = requestManager.useUpdateServerSettings();
    const [currentAutoUpdateIntervalHours, persistAutoUpdateIntervalHours] = usePersistedValue(
        'lastGlobalUpdateInterval',
        DEFAULT_UPDATE_INTERVAL_HOURS,
        autoUpdateIntervalHours,
        getPersistedServerSetting,
    );

    const updateSetting = useCallback(
        (newGlobalUpdateInterval: number) => {
            persistAutoUpdateIntervalHours(
                newGlobalUpdateInterval === 0 ? currentAutoUpdateIntervalHours : newGlobalUpdateInterval,
            );
            mutateSettings({
                variables: {
                    input: {
                        settings: {
                            globalUpdateCron:
                                newGlobalUpdateInterval === 0 ? '' : `0 */${newGlobalUpdateInterval} * * *`,
                        },
                    },
                },
            });
        },
        [currentAutoUpdateIntervalHours],
    );

    const setDoAutoUpdates = (enable: boolean) => {
        const newGlobalUpdateInterval = enable ? currentAutoUpdateIntervalHours : 0;
        updateSetting(newGlobalUpdateInterval);
    };

    return (
        <List>
            <ListItem>
                <ListItemText primary={t`Automatic updates`} />
                <Switch edge="end" checked={doAutoUpdates} onChange={(e) => setDoAutoUpdates(e.target.checked)} />
            </ListItem>
            <NumberSetting
                settingTitle={t`Automatic update interval`}
                settingValue={t`${currentAutoUpdateIntervalHours}h`}
                value={currentAutoUpdateIntervalHours}
                minValue={MIN_UPDATE_INTERVAL_HOURS}
                maxValue={MAX_UPDATE_INTERVAL_HOURS}
                defaultValue={DEFAULT_UPDATE_INTERVAL_HOURS}
                showSlider
                valueUnit={t`h`}
                handleUpdate={updateSetting}
                disabled={!doAutoUpdates}
            />
        </List>
    );
};
