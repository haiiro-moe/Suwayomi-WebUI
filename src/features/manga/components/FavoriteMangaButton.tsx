/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { FlexWrapButton } from '@/base/components/buttons/FlexWrapButton.tsx';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';

const popIn = keyframes`
    0% { transform: scale(0.6); }
    60% { transform: scale(1.25); }
    100% { transform: scale(1); }
`;

export const FavoriteMangaButton = ({ mangaId }: { mangaId: number }) => {
    const { t } = useLingui();
    const [isSaving, setIsSaving] = useState(false);

    const { data, refetch } = requestManager.useGetCurrentUserProfile();
    const isFavorite = useMemo(
        () => !!data?.currentUserProfile?.favoriteMangaIds.includes(mangaId),
        [data?.currentUserProfile?.favoriteMangaIds, mangaId],
    );

    const [addFavorite] = requestManager.useAddFavorite();
    const [removeFavorite] = requestManager.useRemoveFavorite();

    const toggle = async () => {
        setIsSaving(true);
        try {
            if (isFavorite) {
                await removeFavorite({ variables: { input: { mangaId } } });
            } else {
                await addFavorite({ variables: { input: { mangaId } } });
            }
            await refetch();
        } catch (favoriteError) {
            makeToast(
                isFavorite ? t`Could not remove favorite` : t`Could not add favorite`,
                'error',
                getErrorMessage(favoriteError),
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <FlexWrapButton
            onClick={toggle}
            disabled={isSaving}
            variant={isFavorite ? 'contained' : 'outlined'}
            color="secondary"
        >
            <Box
                key={String(isFavorite)}
                sx={{
                    display: 'inline-flex',
                    animation: `${popIn} 0.25s ease-out`,
                }}
            >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </Box>
            {isFavorite ? t`Favorited` : t`Favorite`}
        </FlexWrapButton>
    );
};
