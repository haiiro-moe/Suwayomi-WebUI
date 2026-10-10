/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import FilterList from '@mui/icons-material/FilterList';
import IconButton from '@mui/material/IconButton';
import * as React from 'react';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import Menu from '@mui/material/Menu';
import DownloadIcon from '@mui/icons-material/Download';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { ChapterOptions } from '@/features/chapter/components/ChapterOptions.tsx';
import type { updateChapterListOptions } from '@/features/chapter/utils/ChapterList.util.tsx';
import { isFilterActive } from '@/features/chapter/utils/ChapterList.util.tsx';
import type {
    ChapterBookmarkInfo,
    ChapterDownloadInfo,
    ChapterIdInfo,
    ChapterListOptions,
    ChapterOptimizedInfo,
    ChapterReadInfo,
} from '@/features/chapter/Chapter.types.ts';
import { ChaptersDownloadActionMenuItems } from '@/features/chapter/components/actions/ChaptersDownloadActionMenuItems.tsx';
import { Chapters } from '@/features/chapter/services/Chapters.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';

interface IProps {
    mangaId: number;
    options: ChapterListOptions;
    updateOption: ReturnType<typeof updateChapterListOptions>;
    chapters: (ChapterIdInfo & ChapterReadInfo & ChapterDownloadInfo & ChapterOptimizedInfo & ChapterBookmarkInfo)[];
    scanlators: string[];
    excludeScanlators: string[];
}

export const ChaptersToolbarMenu = ({
    mangaId,
    options,
    updateOption,
    chapters,
    scanlators,
    excludeScanlators,
}: IProps) => {
    const { t } = useLingui();

    const [open, setOpen] = React.useState(false);
    const isFiltered = isFilterActive(options);

    const areAllChaptersRead = useMemo(() => chapters.every(Chapters.isRead), [chapters]);
    const areAllChaptersDownloaded = useMemo(() => chapters.every(Chapters.isDownloaded), [chapters]);
    // re-render on optimization queue changes, the queue state is read from the cache
    const { data: optimizationStatusData } = requestManager.useGetOptimizationStatus({ fetchPolicy: 'cache-only' });
    const optimizableChapters = useMemo(
        () => Chapters.getOptimizable(chapters),
        [chapters, optimizationStatusData?.optimizationStatus.queue],
    );

    return (
        <>
            <CustomTooltip title={t`Mark all as read`} disabled={areAllChaptersRead}>
                <IconButton
                    disabled={areAllChaptersRead}
                    onClick={() => Chapters.markAsRead(Chapters.getNonRead(chapters), true, mangaId)}
                    color="inherit"
                >
                    <DoneAllIcon />
                </IconButton>
            </CustomTooltip>
            <PopupState variant="popover" popupId="chapterlist-download-button">
                {(popupState) => (
                    <>
                        <CustomTooltip title={t`Download & optimize`} disabled={areAllChaptersDownloaded}>
                            <IconButton
                                disabled={areAllChaptersDownloaded}
                                {...bindTrigger(popupState)}
                                color="inherit"
                            >
                                <DownloadIcon />
                            </IconButton>
                        </CustomTooltip>
                        {popupState.isOpen && (
                            <Menu {...bindMenu(popupState)}>
                                <ChaptersDownloadActionMenuItems mangaIds={[mangaId]} closeMenu={popupState.close} />
                            </Menu>
                        )}
                    </>
                )}
            </PopupState>
            <CustomTooltip title={t`Optimize downloaded chapters`} disabled={!optimizableChapters.length}>
                <IconButton
                    disabled={!optimizableChapters.length}
                    onClick={() =>
                        Chapters.optimize(Chapters.getIds(optimizableChapters)).catch(
                            defaultPromiseErrorHandler('ChaptersToolbarMenu::optimize'),
                        )
                    }
                    color="inherit"
                >
                    <AutoFixHighIcon />
                </IconButton>
            </CustomTooltip>
            <CustomTooltip title={t`Filter and sort`}>
                <IconButton onClick={() => setOpen(true)} color="inherit">
                    <FilterList color={isFiltered ? 'warning' : undefined} />
                </IconButton>
            </CustomTooltip>
            <ChapterOptions
                open={open}
                onClose={() => setOpen(false)}
                options={options}
                updateOption={updateOption}
                scanlators={scanlators}
                excludedScanlators={excludeScanlators}
            />
        </>
    );
};
