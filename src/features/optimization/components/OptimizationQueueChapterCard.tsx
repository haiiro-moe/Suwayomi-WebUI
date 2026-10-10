/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import DragHandle from '@mui/icons-material/DragHandle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Refresh from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLingui } from '@lingui/react/macro';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { ChapterCardMetadata } from '@/features/chapter/components/cards/ChapterCardMetadata.tsx';
import { MUIUtil } from '@/lib/mui/MUI.util.ts';
import { ListCardContent } from '@/base/components/lists/cards/ListCardContent.tsx';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import type { ChapterOptimizationStatus } from '@/features/chapter/Chapter.types.ts';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';
import { OptimizationState } from '@/lib/graphql/generated/graphql-base.types.ts';
import { Chapters } from '@/features/chapter/services/Chapters.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';

interface ActionProps {
    reorderOptimizations: (optimization: ChapterOptimizationStatus, mode: 'top' | 'bottom', series?: boolean) => void;
    cancelOptimizations: (optimization: ChapterOptimizationStatus, series?: boolean) => void;
}

const ActionMenu = ({
    open,
    optimization,
    reorderOptimizations,
    cancelOptimizations,
    anchorEl,
}: {
    open: boolean;
    optimization: ChapterOptimizationStatus;
    anchorEl: Element | null;
} & ActionProps) => {
    const { t } = useLingui();

    return (
        <Menu open={open} anchorEl={anchorEl}>
            <MenuItem onClick={() => reorderOptimizations(optimization, 'top')}>{t`Move to top`}</MenuItem>
            <MenuItem onClick={() => reorderOptimizations(optimization, 'top', true)}>{t`Move series to top`}</MenuItem>
            <MenuItem onClick={() => reorderOptimizations(optimization, 'bottom')}>{t`Move to bottom`}</MenuItem>
            <MenuItem onClick={() => reorderOptimizations(optimization, 'bottom', true)}>
                {t`Move series to bottom`}
            </MenuItem>
            <MenuItem onClick={() => cancelOptimizations(optimization)}>{t`Cancel`}</MenuItem>
            <MenuItem onClick={() => cancelOptimizations(optimization, true)}>{t`Cancel all for this series`}</MenuItem>
        </Menu>
    );
};

export const OptimizationQueueChapterCard = memo(
    ({ item, reorderOptimizations, cancelOptimizations }: { item: ChapterOptimizationStatus } & ActionProps) => {
        const { t } = useLingui();
        const preventMobileContextMenu = MediaQuery.usePreventMobileContextMenu();

        const [anchorEl, setAnchorEl] = useState<Element | null>(null);
        const [actionMenuOpen, setActionMenuOpen] = useState(false);

        const isOptimizing = item.state === OptimizationState.Optimizing;
        const isError = item.state === OptimizationState.Error;

        return (
            <Card>
                <CardActionArea
                    component={Link}
                    to={AppRoutes.manga.path(item.manga.id)}
                    onContextMenu={preventMobileContextMenu}
                    sx={MediaQuery.preventMobileContextMenuSx()}
                >
                    <ListCardContent>
                        <IconButton {...MUIUtil.preventRippleProp()} sx={{ pointerEvents: 'none' }}>
                            <DragHandle />
                        </IconButton>
                        <Stack
                            sx={{
                                flexGrow: 1,
                                flexShrink: 1,
                                gap: 1,
                            }}
                        >
                            <Stack sx={{ flexDirection: 'row', alignItems: 'end', flexWrap: 'wrap' }}>
                                <ChapterCardMetadata
                                    title={item.manga.title}
                                    secondaryText={item.chapter.scanlator}
                                    ternaryText={item.chapter.name}
                                />
                                <Typography sx={{ pb: 1, flexGrow: 1, textAlign: 'end' }} variant="caption">
                                    {isError && t`Error`}
                                    {isOptimizing && `${Math.round(item.progress * 100)}%`}
                                </Typography>
                            </Stack>
                            {isOptimizing && (
                                <Box sx={{ width: '100%' }}>
                                    <LinearProgress variant="determinate" value={item.progress * 100} />
                                </Box>
                            )}
                        </Stack>
                        {isError && (
                            <CustomTooltip title={t`Retry`}>
                                <IconButton
                                    {...MUIUtil.preventRippleProp()}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        Chapters.optimize([item.chapter.id]).catch(
                                            defaultPromiseErrorHandler('OptimizationQueueChapterCard::retry'),
                                        );
                                    }}
                                >
                                    <Refresh />
                                </IconButton>
                            </CustomTooltip>
                        )}
                        <CustomTooltip title={t`Options`}>
                            <IconButton
                                ref={setAnchorEl}
                                {...MUIUtil.preventRippleProp()}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActionMenuOpen(!actionMenuOpen);
                                }}
                            >
                                <MoreVertIcon />
                                <ActionMenu
                                    open={actionMenuOpen}
                                    optimization={item}
                                    reorderOptimizations={reorderOptimizations}
                                    cancelOptimizations={cancelOptimizations}
                                    anchorEl={anchorEl}
                                />
                            </IconButton>
                        </CustomTooltip>
                    </ListCardContent>
                </CardActionArea>
            </Card>
        );
    },
);
