/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const GET_USER_DIRECTORY = gql`
    query GET_USER_DIRECTORY {
        userDirectory {
            id
            username
            displayName
            avatarUrl
            role
            description
            favoriteMangaIds
        }
    }
`;

export const GET_USER_PROFILE = gql`
    query GET_USER_PROFILE($profileUserId: Int!) {
        profile(profileUserId: $profileUserId) {
            id
            username
            displayName
            avatarUrl
            role
            description
            bannerUrl
            favoriteMangaIds
            favoriteManga {
                mangaId
                accessible
                manga {
                    id
                    title
                    sourceId
                    inLibrary
                    thumbnailUrl
                    thumbnailUrlLastFetched
                }
            }
        }
    }
`;

export const GET_CONVERSATION = gql`
    query GET_CONVERSATION($otherUserId: Int!) {
        conversation(otherUserId: $otherUserId) {
            id
            senderId
            receiverId
            content
            createdAt
            readAt
            parentId
        }
    }
`;

export const GET_UNREAD_MESSAGE_COUNT = gql`
    query GET_UNREAD_MESSAGE_COUNT {
        unreadMessageCount
    }
`;

export const SEND_MESSAGE = gql`
    mutation SEND_MESSAGE($input: SendMessageInput!) {
        sendMessage(input: $input) {
            messageId
        }
    }
`;

export const MARK_MESSAGE_READ = gql`
    mutation MARK_MESSAGE_READ($input: MarkMessageReadInput!) {
        markMessageRead(input: $input) {
            updated
        }
    }
`;
