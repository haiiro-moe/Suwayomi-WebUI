/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Tab from '@mui/material/Tab';
import { StringParam, useQueryParam } from 'use-query-params';
import { useLingui } from '@lingui/react/macro';
import { Sources } from '@/features/browse/sources/Sources.tsx';
import { Extensions } from '@/features/browse/extensions/Extensions.tsx';
import { TabPanel } from '@/base/components/tabs/TabPanel.tsx';
import { TabsWrapper } from '@/base/components/tabs/TabsWrapper.tsx';
import { TabsMenu } from '@/base/components/tabs/TabsMenu.tsx';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { BrowseTab } from '@/features/browse/Browse.types.ts';
import { usePermissions } from '@/features/authentication/usePermissions.ts';
import { GROUPED_VIRTUOSO_Z_INDEX } from '@/lib/virtuoso/Virtuoso.constants.ts';
import { SearchParam } from '@/base/Base.types.ts';
import { Migration } from '@/features/migration/screens/Migration.tsx';
import { OffsetComponentWithContainer } from '@/base/OffsetComponent.tsx';
import { useElementSize } from '@mantine/hooks';

export function Browse() {
    const { t } = useLingui();
    const permissions = usePermissions();
    const canSeeExtensions =
        permissions.has('browse.extensions.install') || permissions.has('browse.extensions.update');
    const canSeeMigrate = permissions.has('migrate.access');
    const isRequestOnly = permissions.has('browse.request') && !permissions.has('browse.add_to_library');
    useAppTitle(isRequestOnly ? t`Request` : t`Browse`);

    const { ref: tabsMenuRef, height: tabsMenuHeight } = useElementSize();

    const [tabSearchParam, setTabSearchParam] = useQueryParam(SearchParam.TAB, StringParam, {});
    const defaultTab = BrowseTab.SOURCES;
    const tabName = (tabSearchParam as BrowseTab) ?? defaultTab;

    if (!tabSearchParam) {
        setTabSearchParam(tabName, 'replaceIn');
    }

    return (
        <TabsWrapper>
            <OffsetComponentWithContainer
                sx={{ zIndex: 2 }}
                component={
                    <TabsMenu
                        ref={tabsMenuRef}
                        sx={{ zIndex: GROUPED_VIRTUOSO_Z_INDEX }}
                        variant="fullWidth"
                        value={tabName}
                        onChange={(_, newTab) => setTabSearchParam(newTab, 'replaceIn')}
                    >
                        <Tab
                            value={BrowseTab.SOURCES}
                            sx={{ textTransform: 'none' }}
                            label={isRequestOnly ? t`Request` : t`Source`}
                        />
                        {canSeeExtensions && (
                            <Tab value={BrowseTab.EXTENSIONS} sx={{ textTransform: 'none' }} label={t`Extension`} />
                        )}
                        {canSeeMigrate && (
                            <Tab value={BrowseTab.MIGRATE} sx={{ textTransform: 'none' }} label={t`Migrate`} />
                        )}
                    </TabsMenu>
                }
            >
                <TabPanel index={BrowseTab.SOURCE_DEPRECATED} currentIndex={tabName}>
                    <Sources tabsMenuHeight={tabsMenuHeight} />
                </TabPanel>
                <TabPanel index={BrowseTab.SOURCES} currentIndex={tabName}>
                    <Sources tabsMenuHeight={tabsMenuHeight} />
                </TabPanel>
                {canSeeExtensions && (
                    <TabPanel index={BrowseTab.EXTENSIONS} currentIndex={tabName}>
                        <Extensions tabsMenuHeight={tabsMenuHeight} />
                    </TabPanel>
                )}
                {canSeeMigrate && (
                    <TabPanel index={BrowseTab.MIGRATE} currentIndex={tabName}>
                        <Migration />
                    </TabPanel>
                )}
            </OffsetComponentWithContainer>
        </TabsWrapper>
    );
}
