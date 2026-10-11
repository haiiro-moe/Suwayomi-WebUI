/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';
import { OPTIMIZATION_STATUS_FIELDS } from '@/lib/graphql/optimization/OptimizationFragments.ts';

export const GET_OPTIMIZATION_STATUS = gql`
    ${OPTIMIZATION_STATUS_FIELDS}

    query GET_OPTIMIZATION_STATUS {
        optimizationStatus {
            ...OPTIMIZATION_STATUS_FIELDS
        }
    }
`;
