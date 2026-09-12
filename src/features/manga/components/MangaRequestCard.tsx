/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage, markdownToSafeHtml } from '@/lib/HelperFunctions.ts';
import { Mangas } from '@/features/manga/services/Mangas.ts';
import { MANGA_STATUS_TO_TRANSLATION } from '@/features/manga/Manga.constants.ts';
import { MarkdownViewer } from '@/lib/mui-tiptap/MarkdownViewer.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { MangaStatus } from '@/lib/graphql/generated/graphql-base.types.ts';

export const MangaRequestCard = ({ mangaId }: { mangaId: number }) => {
    const { t } = useLingui();
    const [showChapters, setShowChapters] = useState(false);
    const [requestManga] = requestManager.useRequestManga();
    const [isRequesting, setIsRequesting] = useState(false);
    const [requested, setRequested] = useState(false);

    const { data, loading, error } = requestManager.useGetRequestPreview(mangaId);
    const preview = data?.requestPreview;

    if (loading && !preview) {
        return <LoadingPlaceholder />;
    }
    if (error || !preview) {
        return (
            <Typography color="error" sx={{ textAlign: 'center' }}>
                {error ? getErrorMessage(error) : t`Manga does not exist`}
            </Typography>
        );
    }

    const { manga, chapters } = preview;
    const thumbnailUrl = Mangas.getThumbnailUrl(manga);

    const submit = async () => {
        setIsRequesting(true);
        try {
            await requestManga({ variables: { input: { mangaId: manga.id } } });
            setRequested(true);
        } catch (requestError) {
            makeToast(t`Could not submit request`, 'error', getErrorMessage(requestError));
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{ maxWidth: 720, width: '100%', mx: 'auto', overflow: 'hidden' }}>
            <Stack direction="row" spacing={2} sx={{ p: 2 }}>
                <Box
                    component="img"
                    src={thumbnailUrl}
                    alt={manga.title}
                    sx={{
                        width: 140,
                        height: 210,
                        objectFit: 'cover',
                        borderRadius: 2,
                        flexShrink: 0,
                        bgcolor: 'action.hover',
                    }}
                />
                <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" component="h1" sx={{ wordBreak: 'break-word' }}>
                        {manga.title}
                    </Typography>
                    {manga.author && (
                        <Typography color="text.secondary" variant="body2">
                            {manga.author}
                            {manga.artist && manga.artist !== manga.author ? ` · ${manga.artist}` : ''}
                        </Typography>
                    )}
                    {manga.status != null && manga.status !== MangaStatus.Unknown && (
                        <Chip
                            size="small"
                            label={t(MANGA_STATUS_TO_TRANSLATION[manga.status])}
                            sx={{ alignSelf: 'flex-start' }}
                        />
                    )}
                    {!!manga.genre.length && (
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {manga.genre.slice(0, 5).map((genre) => (
                                <Chip key={genre} label={genre} size="small" variant="outlined" />
                            ))}
                        </Stack>
                    )}
                    <Typography color="text.secondary" variant="body2">
                        {t`${chapters.length} chapters`}
                    </Typography>
                </Stack>
            </Stack>

            {manga.description && (
                <>
                    <Divider />
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <MarkdownViewer markdown={markdownToSafeHtml(manga.description)} />
                    </Box>
                </>
            )}

            <Divider />
            <Button
                fullWidth
                onClick={() => setShowChapters((current) => !current)}
                endIcon={showChapters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'space-between', px: 2, textTransform: 'none' }}
            >
                {t`Chapters`}
            </Button>
            <Collapse in={showChapters}>
                <Box sx={{ maxHeight: 320, overflow: 'auto', px: 2, pb: 1.5 }}>
                    {chapters.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">{t`No chapters found.`}</Typography>
                    ) : (
                        chapters.map((chapter) => (
                            <Stack
                                key={`${chapter.name}-${chapter.chapterNumber ?? 'na'}-${chapter.scanlator ?? ''}`}
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: 'baseline', py: 0.5 }}
                            >
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                    {chapter.name}
                                </Typography>
                                {chapter.scanlator && (
                                    <Typography color="text.secondary" variant="caption">
                                        {chapter.scanlator}
                                    </Typography>
                                )}
                            </Stack>
                        ))
                    )}
                </Box>
            </Collapse>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Button fullWidth variant="contained" onClick={submit} disabled={isRequesting || requested}>
                    {requested ? t`Request submitted` : t`Request this manga`}
                </Button>
                {requested && (
                    <Typography
                        color="text.secondary"
                        variant="caption"
                        sx={{ display: 'block', mt: 1, textAlign: 'center' }}
                    >
                        {t`An administrator will review your request.`}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};
