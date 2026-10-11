/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import Refresh from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useMemo, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useWindowEvent } from '@mantine/hooks';
import { useLingui } from '@lingui/react/macro';
import { plural } from '@lingui/core/macro';
import groupBy from 'lodash/fp/groupBy';
import mapValues from 'lodash/fp/mapValues';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import type { ChapterOptimizationReorderInput } from '@/lib/graphql/generated/graphql-base.types.ts';
import { OptimizationState, OptimizerState } from '@/lib/graphql/generated/graphql-base.types.ts';
import { coerceIn, getErrorMessage } from '@/lib/HelperFunctions.ts';
import { DndSortableItem } from '@/lib/dnd-kit/DndSortableItem.tsx';
import { DndKitUtil } from '@/lib/dnd-kit/DndKitUtil.ts';
import { DndOverlayItem } from '@/lib/dnd-kit/DndOverlayItem.tsx';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { useAppAction } from '@/features/navigation-bar/hooks/useAppAction.ts';
import type { ChapterOptimizationStatus } from '@/features/chapter/Chapter.types.ts';
import { VirtuosoPersisted } from '@/lib/virtuoso/Component/VirtuosoPersisted.tsx';
import { STABLE_EMPTY_ARRAY } from '@/base/Base.constants.ts';
import { StyledGroupItemWrapper } from '@/base/components/virtuoso/StyledGroupItemWrapper.tsx';
import { Chapters } from '@/features/chapter/services/Chapters.ts';
import { OptimizationQueueChapterCard } from '@/features/optimization/components/OptimizationQueueChapterCard.tsx';
import { usePermissions } from '@/features/authentication/usePermissions.ts';
import { OPTIMIZATIONS_MANAGE_PERMISSION } from '@/features/optimization/Optimization.constants.ts';

export const OptimizationQueue = () => {
    const { t } = useLingui();

    useAppTitle(t`Optimization queue`);
    const canManage = usePermissions().has(OPTIMIZATIONS_MANAGE_PERMISSION);

    const [reorderOptimizationsMutation] = requestManager.useReorderChaptersInOptimizationQueue();

    const {
        data: optimizationStatusData,
        loading: isLoading,
        dataState,
        error,
        refetch,
    } = requestManager.useGetOptimizationStatus();
    const optimizerData = optimizationStatusData?.optimizationStatus;

    const queue = optimizerData?.queue ?? STABLE_EMPTY_ARRAY;
    const status = optimizerData?.state ?? OptimizerState.Started;
    const isQueueEmpty = !queue.length;

    const dndSensors = DndKitUtil.useSensorsForDevice();
    const [dndActiveOptimization, setDndActiveOptimization] = useState<ChapterOptimizationStatus | null>(null);

    const chaptersByManga = useMemo(
        () =>
            mapValues(
                (optimizations: ChapterOptimizationStatus[]) =>
                    optimizations.map((optimization) => optimization.chapter),
                groupBy((optimization) => optimization.manga.id, queue),
            ),
        [queue],
    );

    const failedChapterIds = useMemo(
        () => queue.filter((item) => item.state === OptimizationState.Error).map((item) => item.chapter.id),
        [queue],
    );

    const retryOptimizations = async () => {
        try {
            await Chapters.optimize(failedChapterIds);
        } catch (e) {
            makeToast(t`Could not retry failed optimizations`, 'error', getErrorMessage(e));
        }
    };

    const clearQueue = async () => {
        try {
            await requestManager.clearOptimizer().response;
        } catch (e) {
            makeToast(t`Could not remove all optimizations from the queue`, 'error', getErrorMessage(e));
        }
    };

    const toggleQueueStatus = () => {
        const { response } =
            status === OptimizerState.Stopped ? requestManager.startOptimizer() : requestManager.stopOptimizer();

        response.catch(defaultPromiseErrorHandler('OptimizationQueue::toggleQueueStatus'));
    };

    const optimizationReorder = (reorders: ChapterOptimizationReorderInput[]) => {
        const isOrderUnchanged = reorders.every(
            (reorder) => queue.findIndex((item) => item.chapter.id === reorder.chapterId) === reorder.to,
        );
        if (isOrderUnchanged) {
            return;
        }

        reorderOptimizationsMutation({ variables: { input: { reorders } } }).catch((e) => {
            makeToast(
                plural(reorders.length, {
                    one: 'Could not reorder optimization',
                    other: 'Could not reorder optimizations',
                }),
                'error',
                getErrorMessage(e),
            );
        });
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setDndActiveOptimization(null);

        if (!over || active.id === over.id) {
            return;
        }

        const newIndex = queue.findIndex((optimization) => optimization.chapter.id === over.id);

        optimizationReorder([{ chapterId: active.id as number, to: newIndex }]);
    };

    const reorderOptimizations = (
        optimization: ChapterOptimizationStatus,
        mode: 'top' | 'bottom',
        series?: boolean,
    ) => {
        const chapters = series ? chaptersByManga[optimization.manga.id] : [optimization.chapter];
        const newIndex = mode === 'top' ? 0 : queue.length - chapters.length;

        optimizationReorder(
            chapters.map((chapter, index) => ({
                chapterId: chapter.id,
                to: coerceIn(newIndex + index, 0, queue.length - 1),
            })),
        );
    };

    const cancelOptimizations = (optimization: ChapterOptimizationStatus, series?: boolean) => {
        const chapters = series ? chaptersByManga[optimization.manga.id] : [optimization.chapter];

        Chapters.cancelOptimization(Chapters.getIds(chapters)).catch(
            defaultPromiseErrorHandler('OptimizationQueue::cancelOptimizations'),
        );
    };

    useAppAction(
        canManage && (
            <>
                <CustomTooltip title={t`Retry all`} disabled={!failedChapterIds.length}>
                    <IconButton onClick={retryOptimizations} color="inherit" disabled={!failedChapterIds.length}>
                        <Refresh />
                    </IconButton>
                </CustomTooltip>

                <CustomTooltip title={t`Delete all`}>
                    <IconButton onClick={clearQueue} color="inherit">
                        <DeleteSweepIcon />
                    </IconButton>
                </CustomTooltip>

                <CustomTooltip title={status === OptimizerState.Started ? t`Stop` : t`Start`} disabled={isQueueEmpty}>
                    <IconButton onClick={toggleQueueStatus} disabled={isQueueEmpty} color="inherit">
                        {status === OptimizerState.Stopped ? <PlayArrowIcon /> : <PauseIcon />}
                    </IconButton>
                </CustomTooltip>
            </>
        ),
        [canManage, status, isQueueEmpty, failedChapterIds.length],
    );

    // Virtuoso's resize observer can throw this error,
    // which is caught by DnD and aborts dragging.
    useWindowEvent('error', (e) => {
        if (
            e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
            e.message === 'ResizeObserver loop limit exceeded'
        ) {
            e.stopImmediatePropagation();
        }
    });

    if (isLoading && dataState !== 'complete') {
        return <LoadingPlaceholder />;
    }

    if (error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load data`}
                messageExtra={getErrorMessage(error)}
                retry={() => refetch().catch(defaultPromiseErrorHandler('OptimizationQueue::refetch'))}
            />
        );
    }

    if (isQueueEmpty) {
        return <EmptyViewAbsoluteCentered message={t`No optimizations`} />;
    }

    return (
        <Box sx={{ pb: 1 }}>
            <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragStart={(event) =>
                    setDndActiveOptimization(
                        queue.find((optimization) => optimization.chapter.id === event.active.id) ?? null,
                    )
                }
                onDragEnd={onDragEnd}
                onDragCancel={() => setDndActiveOptimization(null)}
                onDragAbort={() => setDndActiveOptimization(null)}
            >
                <SortableContext
                    disabled={!canManage}
                    items={queue.map((optimization) => optimization.chapter)}
                    strategy={verticalListSortingStrategy}
                >
                    <VirtuosoPersisted
                        persistKey="optimization-queue"
                        useWindowScroll
                        totalCount={queue.length}
                        computeItemKey={(index) => `optimization-chapter-${queue[index].chapter.id}`}
                        itemContent={(index) => (
                            <DndSortableItem
                                id={queue[index].chapter.id}
                                isDragging={queue[index].chapter.id === dndActiveOptimization?.chapter.id}
                            >
                                <StyledGroupItemWrapper>
                                    <OptimizationQueueChapterCard
                                        item={queue[index]}
                                        reorderOptimizations={reorderOptimizations}
                                        cancelOptimizations={cancelOptimizations}
                                        canManage={canManage}
                                    />
                                </StyledGroupItemWrapper>
                            </DndSortableItem>
                        )}
                    />
                </SortableContext>
                <DndOverlayItem isActive={!!dndActiveOptimization}>
                    <OptimizationQueueChapterCard
                        item={dndActiveOptimization!}
                        reorderOptimizations={reorderOptimizations}
                        cancelOptimizations={cancelOptimizations}
                        canManage={canManage}
                    />
                </DndOverlayItem>
            </DndContext>
        </Box>
    );
};
