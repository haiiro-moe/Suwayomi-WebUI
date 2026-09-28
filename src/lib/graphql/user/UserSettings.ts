/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const GET_USER_SETTINGS = gql`
    query GET_USER_SETTINGS {
        userSettings {
            key
            value
        }
    }
`;

export const SET_USER_SETTINGS = gql`
    mutation SET_USER_SETTINGS($input: SetUserSettingsInput!) {
        setUserSettings(input: $input) {
            updated
        }
    }
`;

export const RESET_USER_SETTINGS = gql`
    mutation RESET_USER_SETTINGS($input: ResetUserSettingsInput!) {
        resetUserSettings(input: $input) {
            updated
        }
    }
`;
