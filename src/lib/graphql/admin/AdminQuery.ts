/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const GET_CATEGORY_ACCESS = gql`
    query GET_CATEGORY_ACCESS($userId: Int!) {
        categoryAccess(userId: $userId) {
            userId
            categoryId
            canRead
            canEdit
        }
    }
`;

export const GET_ADMIN_USERS = gql`
    query GET_ADMIN_USERS {
        users {
            id
            username
            displayName
            role
            avatarUrl
        }
    }
`;

export const GET_ADMIN_ROLES = gql`
    query GET_ADMIN_ROLES {
        roles {
            id
            name
            description
            permissions
        }
        permissionNodes
    }
`;
