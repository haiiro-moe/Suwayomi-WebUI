/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { SplashScreen } from '@/features/authentication/components/SplashScreen.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AuthManager } from '@/features/authentication/AuthManager.ts';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
    const { isAuthRequired } = AuthManager.useSession();

    const { data, error } = requestManager.useGetAbout({
        skip: isAuthRequired !== null,
    });

    useEffect(() => {
        if ((!data && !error) || AuthManager.isAuthInitialized()) {
            return;
        }

        if (error) {
            // GET_ABOUT includes authenticated metadata. A fresh/reset browser can
            // still hold a refresh token that no longer exists in the new database.
            // Treat the probe failure as an authentication boundary, not as a
            // successful unauthenticated session.
            AuthManager.removeTokens();
            AuthManager.setAuthRequired(true);
        } else {
            AuthManager.setAuthRequired(false);
        }
        AuthManager.setAuthInitialized(true);
        requestManager.processQueues();
    }, [data, error]);

    if (isAuthRequired === null) {
        return <SplashScreen />;
    }

    return children;
};
