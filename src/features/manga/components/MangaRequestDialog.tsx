/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { Mangas } from '@/features/manga/services/Mangas.ts';
import type { MangaIdInfo, MangaTitleInfo, MangaThumbnailInfo } from '@/features/manga/Manga.types.ts';

type RequestableManga = MangaIdInfo & MangaTitleInfo & Partial<MangaThumbnailInfo>;

export const MangaRequestDialog = ({
    manga,
    open,
    onClose,
}: {
    manga: RequestableManga;
    open: boolean;
    onClose: () => void;
}) => {
    const { t } = useLingui();
    const [requestManga] = requestManager.useRequestManga();
    const [isRequesting, setIsRequesting] = useState(false);
    const [requested, setRequested] = useState(false);

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
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>{requested ? t`Request submitted` : t`Request manga`}</DialogTitle>
            <DialogContent>
                {requested ? (
                    <Typography>
                        {t`An administrator will review your request. The manga will be added to the library if approved.`}
                    </Typography>
                ) : (
                    <Stack spacing={2} sx={{ alignItems: 'center' }}>
                        {manga.thumbnailUrl ? (
                            <Box
                                component="img"
                                src={Mangas.getThumbnailUrl(manga)}
                                alt={manga.title}
                                sx={{ width: 120, borderRadius: 2 }}
                            />
                        ) : null}
                        <Typography variant="h6" sx={{ textAlign: 'center', wordBreak: 'break-word' }}>
                            {manga.title}
                        </Typography>
                        <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center' }}>
                            {t`You do not have access to read this manga. You can request it to be added to the library.`}
                        </Typography>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{requested ? t`Close` : t`Cancel`}</Button>
                {!requested && (
                    <Button variant="contained" onClick={submit} disabled={isRequesting}>{t`Request`}</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
