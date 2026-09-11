/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { FlexWrapButton } from '@/base/components/buttons/FlexWrapButton.tsx';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';

export const FavoriteMangaButton = ({ mangaId }: { mangaId: number }) => {
    const { t } = useLingui();

    const { data, refetch } = requestManager.useGetCurrentUserProfile();
    const isFavorite = useMemo(
        () => !!data?.currentUserProfile?.favoriteMangaIds.includes(mangaId),
        [data?.currentUserProfile?.favoriteMangaIds, mangaId],
    );

    const [addFavorite] = requestManager.useAddFavorite();
    const [removeFavorite] = requestManager.useRemoveFavorite();

    const toggle = async () => {
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
        }
    };

    return (
        <FlexWrapButton onClick={toggle} variant={isFavorite ? 'contained' : 'outlined'} color="secondary">
            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            {isFavorite ? t`Favorited` : t`Favorite`}
        </FlexWrapButton>
    );
};
