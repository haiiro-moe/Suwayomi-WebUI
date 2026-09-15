/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const SET_CATEGORY_ACCESS = gql`
    mutation SET_CATEGORY_ACCESS($input: SetCategoryAccessInput!) {
        setCategoryAccess(input: $input) {
            updated
        }
    }
`;

export const CREATE_USER = gql`
    mutation CREATE_USER($input: CreateUserInput!) {
        createUser(input: $input) {
            id
        }
    }
`;

export const UPDATE_USER = gql`
    mutation UPDATE_USER($input: UpdateUserInput!) {
        updateUser(input: $input) {
            updated
        }
    }
`;

export const DELETE_USER = gql`
    mutation DELETE_USER($input: DeleteUserInput!) {
        deleteUser(input: $input) {
            success
        }
    }
`;

export const CREATE_ROLE = gql`
    mutation CREATE_ROLE($input: RoleInput!) {
        createRole(input: $input) {
            id
        }
    }
`;

export const UPDATE_ROLE = gql`
    mutation UPDATE_ROLE($input: UpdateRoleInput!) {
        updateRole(input: $input) {
            success
        }
    }
`;

export const DELETE_ROLE = gql`
    mutation DELETE_ROLE($input: DeleteRoleInput!) {
        deleteRole(input: $input) {
            success
        }
    }
`;
