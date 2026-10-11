/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { UserEventsSubscription } from '@/lib/graphql/generated/graphql.ts';
import { UserEventType } from '@/lib/graphql/generated/graphql-base.types.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';

type UserEvent = UserEventsSubscription['userEvents'];

const REFETCH_DEBOUNCE_MS = 250;

const MESSAGE_QUERIES = ['GET_UNREAD_MESSAGE_COUNT'];
const CONVERSATION_QUERY = 'GET_CONVERSATION';
const REQUEST_QUERIES = ['GET_MANGA_REQUESTS', 'GET_PENDING_MANGA_REQUEST_COUNT'];

let pendingConversationUserIds = new Set<number>();
let refetchMessages = false;
let refetchRequests = false;
let refetchTimeout: ReturnType<typeof setTimeout> | undefined;

const flush = () => {
    const conversationUserIds = pendingConversationUserIds;
    const includeMessages = refetchMessages;
    const includeRequests = refetchRequests;

    pendingConversationUserIds = new Set();
    refetchMessages = false;
    refetchRequests = false;

    // only refetch queries that are currently being displayed
    requestManager.graphQLClient.client
        .refetchQueries({
            include: 'active',
            onQueryUpdated: (observableQuery) => {
                const { queryName } = observableQuery;

                if (!queryName) {
                    return false;
                }

                if (includeMessages && MESSAGE_QUERIES.includes(queryName)) {
                    return true;
                }

                if (includeMessages && queryName === CONVERSATION_QUERY) {
                    const otherUserId = (observableQuery.variables as { otherUserId?: number } | undefined)
                        ?.otherUserId;
                    return otherUserId !== undefined && conversationUserIds.has(otherUserId);
                }

                return includeRequests && REQUEST_QUERIES.includes(queryName);
            },
        })
        .catch(() => {});
};

/**
 * The server only notifies about changes, the affected queries get refetched (debounced to batch bursts of events,
 * e.g. when marking multiple messages as read).
 */
export const handleUserEvent = (event: UserEvent | undefined) => {
    if (!event) {
        return;
    }

    switch (event.type) {
        case UserEventType.MessagesChanged:
            refetchMessages = true;
            if (event.otherUserId != null) {
                pendingConversationUserIds.add(event.otherUserId);
            }
            break;
        case UserEventType.RequestsChanged:
            refetchRequests = true;
            break;
        default:
            return;
    }

    clearTimeout(refetchTimeout);
    refetchTimeout = setTimeout(flush, REFETCH_DEBOUNCE_MS);
};
