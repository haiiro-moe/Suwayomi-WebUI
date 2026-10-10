/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { t } from '@lingui/core/macro';
import type { ChapterDownloadInfo, ChapterOptimizedInfo } from '@/features/chapter/Chapter.types.ts';
import { OptimizationState } from '@/lib/graphql/generated/graphql-base.types.ts';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export const formatBytes = (bytes: number): string => {
    const exponent = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), BYTE_UNITS.length - 1);
    const value = bytes / 1024 ** exponent;

    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${BYTE_UNITS[exponent]}`;
};

/**
 * The muted state text shown next to a chapter, e.g. "Downloaded" or "Optimizing (42%)"
 */
export const getChapterDownloadStateText = (
    { isDownloaded, isOptimized }: ChapterDownloadInfo & Partial<ChapterOptimizedInfo>,
    optimization: { state: OptimizationState; progress: number } | null | undefined,
): string | null => {
    if (optimization) {
        switch (optimization.state) {
            case OptimizationState.Optimizing:
                return t`Optimizing (${Math.round(optimization.progress * 100)}%)`;
            case OptimizationState.Error:
                return t`Optimization failed`;
            default:
                return t`Queued for optimization`;
        }
    }

    if (isDownloaded && isOptimized) {
        return t`Downloaded · Optimized`;
    }

    if (isDownloaded) {
        return t`Downloaded`;
    }

    return null;
};
