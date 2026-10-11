/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';
import { MANGA_BASE_FIELDS } from '@/lib/graphql/manga/MangaFragments.ts';
import { CHAPTER_BASE_FIELDS } from '@/lib/graphql/chapter/ChapterFragments.ts';

export const OPTIMIZATION_TYPE_FIELDS = gql`
    ${MANGA_BASE_FIELDS}
    ${CHAPTER_BASE_FIELDS}

    fragment OPTIMIZATION_TYPE_FIELDS on OptimizationType {
        chapter {
            ...CHAPTER_BASE_FIELDS
            isDownloaded
            isOptimized
            pageCount
        }

        manga {
            ...MANGA_BASE_FIELDS
        }

        progress
        state
        tries
        position
        originalSize
        optimizedSize
    }
`;

export const OPTIMIZATION_STATUS_FIELDS = gql`
    ${OPTIMIZATION_TYPE_FIELDS}

    fragment OPTIMIZATION_STATUS_FIELDS on OptimizationStatus {
        state

        queue {
            ...OPTIMIZATION_TYPE_FIELDS
        }
    }
`;

export const OPTIMIZATION_UPDATES_FIELDS = gql`
    ${OPTIMIZATION_TYPE_FIELDS}

    fragment OPTIMIZATION_UPDATES_FIELDS on OptimizationUpdates {
        state

        updates {
            type
            optimization {
                ...OPTIMIZATION_TYPE_FIELDS
            }
        }
    }
`;
