/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const USER_LOGIN = gql`
    mutation USER_LOGIN($password: String!, $username: String!) {
        login(input: { password: $password, username: $username }) {
            accessToken
            refreshToken
        }
    }
`;

export const SETUP_OWNER = gql`
    mutation SETUP_OWNER($password: String!, $username: String!) {
        setupOwner(input: { password: $password, username: $username }) {
            accessToken
            refreshToken
        }
    }
`;

export const USER_REFRESH = gql`
    mutation USER_REFRESH($refreshToken: String!) {
        refreshToken(input: { refreshToken: $refreshToken }) {
            accessToken
        }
    }
`;

export const UPDATE_PROFILE = gql`
    mutation UPDATE_PROFILE($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
            updated
        }
    }
`;

export const ADD_FAVORITE = gql`
    mutation ADD_FAVORITE($input: FavoriteMangaInput!) {
        addFavorite(input: $input) {
            updated
        }
    }
`;

export const REMOVE_FAVORITE = gql`
    mutation REMOVE_FAVORITE($input: FavoriteMangaInput!) {
        removeFavorite(input: $input) {
            updated
        }
    }
`;

export const SET_MANGA_NOTE = gql`
    mutation SET_MANGA_NOTE($input: SetMangaNoteInput!) {
        setMangaNote(input: $input) {
            updated
        }
    }
`;

export const GET_MY_MANGA_NOTE = gql`
    query GET_MY_MANGA_NOTE($mangaId: Int!) {
        myMangaNote(mangaId: $mangaId)
    }
`;

export const GET_OTHER_USER_MANGA_NOTES = gql`
    query GET_OTHER_USER_MANGA_NOTES($mangaId: Int!) {
        otherUserMangaNotes(mangaId: $mangaId) {
            userId
            username
            displayName
            note
        }
    }
`;
