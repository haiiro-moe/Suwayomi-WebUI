/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { StringParam, useQueryParam } from 'use-query-params';
import { useLingui } from '@lingui/react/macro';
import { PasswordTextField } from '@/base/components/inputs/PasswordTextField.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { SubpathUtil } from '@/lib/utils/SubpathUtil.ts';
import { AuthManager } from '@/features/authentication/AuthManager.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import { SearchParam } from '@/base/Base.types.ts';
import { SplashScreen } from '@/features/authentication/components/SplashScreen.tsx';
import { ServerAddressSetting } from '@/features/settings/components/ServerAddressSetting.tsx';

export const LoginPage = () => {
    const theme = useTheme();
    const { t } = useLingui();
    const { setOverride } = useNavBarContext();
    const navigate = useNavigate();
    const isAuthenticated = AuthManager.useIsAuthenticated();

    const [redirect] = useQueryParam(SearchParam.REDIRECT, StringParam);
    const [loginUser, { loading: isLoading }] = requestManager.useLoginUser();
    const { data: onboardingData } = requestManager.useOnboardingStatus();
    const [setupOwner, { loading: isSettingUp }] = requestManager.useSetupOwner();
    const onboardingRequired = onboardingData?.onboardingStatus === true;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { data: aboutData } = requestManager.useGetAbout();
    const ssoEnabled = aboutData?.aboutServer.ssoEnabled === true;

    const doSetup = async () => {
        if (password !== confirmPassword) {
            makeToast(t`Passwords do not match`, 'error');
            return;
        }
        try {
            const { data } = await setupOwner({ variables: { username, password } });
            if (data) {
                AuthManager.setTokens(data.setupOwner.accessToken, data.setupOwner.refreshToken);
                requestManager.processQueues();
                navigate(redirect ?? AppRoutes.root.path);
            }
        } catch (e) {
            makeToast(t`Could not set up the owner account`, 'error', getErrorMessage(e));
        }
    };

    const doLogin = async () => {
        try {
            const { data } = await loginUser({ variables: { username, password } });

            if (data) {
                AuthManager.setTokens(data.login.accessToken, data.login.refreshToken);
                requestManager.processQueues();
                navigate(redirect ?? AppRoutes.root.path);
            }
        } catch (e) {
            makeToast(t`Could not log in to Suwairo`, 'error', getErrorMessage(e));
        }
    };

    useEffect(() => {
        setOverride({ status: true, value: null });

        return () => setOverride({ status: false, value: null });
    }, []);

    if (isAuthenticated) {
        return <Navigate to={AppRoutes.root.path} replace />;
    }

    return (
        <Stack
            sx={{
                [theme.breakpoints.up('lg')]: {
                    flexDirection: 'row',
                },
            }}
        >
            <SplashScreen
                slots={{
                    stackProps: {
                        sx: {
                            position: 'unset',
                            minWidth: 'auto',
                            minHeight: '50vh',
                            flexBasis: '60%',
                            p: 4,
                            [theme.breakpoints.up('lg')]: {
                                minHeight: '0vh',
                                height: '100vh',
                            },
                        },
                    },
                    serverAddressProps: {
                        sx: {
                            display: 'none',
                        },
                    },
                }}
            />
            <Stack
                sx={{
                    position: 'relative',
                    minHeight: '50vh',
                    flexBasis: '40%',
                    p: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    [theme.breakpoints.up('lg')]: {
                        minHeight: '0vh',
                        height: '100vh',
                    },
                }}
            >
                <Stack sx={{ maxWidth: 300, gap: 2 }}>
                    <Stack>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="username"
                            name="username"
                            label={t`Username`}
                            type="text"
                            fullWidth
                            variant="standard"
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <PasswordTextField
                            margin="dense"
                            fullWidth
                            variant="standard"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {onboardingRequired && (
                            <PasswordTextField
                                margin="dense"
                                fullWidth
                                variant="standard"
                                label={t`Confirm password`}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        )}
                    </Stack>
                    <Button
                        disabled={isLoading || isSettingUp || (!username && !password)}
                        variant="contained"
                        onClick={onboardingRequired ? doSetup : doLogin}
                    >
                        {onboardingRequired ? t`Create owner account` : t`Log in`}
                    </Button>
                    {ssoEnabled && (
                        <>
                            <Divider>
                                <Typography color="text.secondary" variant="caption">{t`or`}</Typography>
                            </Divider>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    const subpath = SubpathUtil.getSubpath();
                                    const ssoUrl = `${window.location.origin}${subpath}/sso/login`;
                                    const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
                                    window.location.href = `${ssoUrl}${redirectParam}`;
                                }}
                            >
                                {t`Sign in with SSO`}
                            </Button>
                        </>
                    )}
                    <Stack sx={{ position: 'absolute', left: 0, bottom: 0 }}>
                        <ServerAddressSetting />
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};
