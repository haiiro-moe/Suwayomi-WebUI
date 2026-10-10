/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';
import { OPTIMIZATION_UPDATES_FIELDS } from '@/lib/graphql/optimization/OptimizationFragments.ts';

export const OPTIMIZATION_STATUS_SUBSCRIPTION = gql`
    ${OPTIMIZATION_UPDATES_FIELDS}

    subscription OPTIMIZATION_STATUS_SUBSCRIPTION {
        optimizationStatusChanged {
            ...OPTIMIZATION_UPDATES_FIELDS
        }
    }
`;
