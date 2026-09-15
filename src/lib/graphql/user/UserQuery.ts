/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const ONBOARDING_STATUS = gql`
    query ONBOARDING_STATUS {
        onboardingStatus
    }
`;

export const GET_CURRENT_USER_PROFILE = gql`
    query GET_CURRENT_USER_PROFILE {
        currentUserProfile {
            id
            username
            displayName
            avatarUrl
            role
            description
            bannerUrl
            favoriteMangaIds
            permissions
        }
    }
`;
