/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';
import { OPTIMIZATION_STATUS_FIELDS } from '@/lib/graphql/optimization/OptimizationFragments.ts';

export const ENQUEUE_CHAPTER_OPTIMIZATIONS = gql`
    ${OPTIMIZATION_STATUS_FIELDS}

    mutation ENQUEUE_CHAPTER_OPTIMIZATIONS($input: EnqueueChapterOptimizationsInput!) {
        enqueueChapterOptimizations(input: $input) {
            optimizationStatus {
                ...OPTIMIZATION_STATUS_FIELDS
            }
        }
    }
`;

export const DEQUEUE_CHAPTER_OPTIMIZATIONS = gql`
    ${OPTIMIZATION_STATUS_FIELDS}

    mutation DEQUEUE_CHAPTER_OPTIMIZATIONS($input: DequeueChapterOptimizationsInput!) {
        dequeueChapterOptimizations(input: $input) {
            optimizationStatus {
                ...OPTIMIZATION_STATUS_FIELDS
            }
        }
    }
`;

export const REORDER_CHAPTER_OPTIMIZATIONS = gql`
    ${OPTIMIZATION_STATUS_FIELDS}

    mutation REORDER_CHAPTER_OPTIMIZATIONS($input: ReorderChapterOptimizationsInput!) {
        reorderChapterOptimizations(input: $input) {
            optimizationStatus {
                ...OPTIMIZATION_STATUS_FIELDS
            }
        }
    }
`;

export const CLEAR_OPTIMIZER = gql`
    ${OPTIMIZATION_STATUS_FIELDS}

    mutation CLEAR_OPTIMIZER($input: ClearOptimizerInput = {}) {
        clearOptimizer(input: $input) {
            optimizationStatus {
                ...OPTIMIZATION_STATUS_FIELDS
            }
        }
    }
`;

export const START_OPTIMIZER = gql`
    ${OPTIMIZATION_STATUS_FIELDS}

    mutation START_OPTIMIZER($input: StartOptimizerInput = {}) {
        startOptimizer(input: $input) {
            optimizationStatus {
                ...OPTIMIZATION_STATUS_FIELDS
            }
        }
    }
`;

export const STOP_OPTIMIZER = gql`
    ${OPTIMIZATION_STATUS_FIELDS}

    mutation STOP_OPTIMIZER($input: StopOptimizerInput = {}) {
        stopOptimizer(input: $input) {
            optimizationStatus {
                ...OPTIMIZATION_STATUS_FIELDS
            }
        }
    }
`;
