import { useContext, useEffect, useRef, useState } from 'react';
import { ContextualMenu, IContextualMenuItem, Stack } from '@fluentui/react'
import { NavItem } from './NavItem';
import { INavItem } from '../data/Navigation';
import md5 from 'md5';
import { Link } from 'react-router-dom';
import AppMsalAuthService from '../services/AppMsalAuthService';
import { ApplicationContext } from '../App';
import { NavSearch } from './NavSearch';
import React from 'react';

export interface INavProps {
    className?: string,
    navigation: INavItem[]
}

const getProfileInitials = (auth: AppMsalAuthService) => {
    const name = auth.context().getAccount()?.name ?? "";
    return name?.split(' ').map((n: string) => n[0]?.toUpperCase()).join('');
}

const getProfileImageAsync = async (auth: AppMsalAuthService, callback: Function) => {

    const account = auth.context().getAccount();

    if (!account) {
        return "";
    }

    const email = account.userName;
    const hash = md5(email);
    let profileImageUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon&r=g`;

    try {
        const authToken = await auth.context().acquireTokenSilent({ scopes: ["user.read"] });
        const profileResponse = await fetch(`https://graph.microsoft.com/v1.0/me/photo/$value`, { headers: { Authorization: `Bearer ${authToken.accessToken}` } });
        const profileImage = await profileResponse.blob();
        profileImageUrl = URL.createObjectURL(profileImage);
    }
    finally {
        callback(profileImageUrl);
    }
}

const getProfileMenutItems = (auth: AppMsalAuthService, setProfileMenuItems: Function) => {
    
    const menuItems: IContextualMenuItem[] = [
        {
            key: 'name',
            text: auth.context().getAccount()?.name ?? "",
            iconProps: { iconName: 'Contact' },
        },
        {
            key: 'settings',
            text: 'Settings',
            iconProps: { iconName: 'Settings' },
        },
        {
            key: 'signout',
            text: 'Sign Out',
            onClick: () => {
                auth.context().logout();
            }
        }
    ];


    setProfileMenuItems(menuItems);
}

const initializeProfile = (auth: AppMsalAuthService, setProfileName: Function, setProfilePicture: Function, setProfileMenuItems: Function) => {
    setProfileName(getProfileInitials(auth));
    getProfileImageAsync(auth, setProfilePicture);
    getProfileMenutItems(auth, setProfileMenuItems);
}

export const Nav: React.FC<INavProps> = ({ navigation, className }) => {
    const profileRef = useRef(null);
    const [profileName, setProfileName] = useState("");
    const [profilePicture, setProfilePicture] = useState("");
    const [showContextualMenu, setShowContextualMenu] = useState(false);
    const [profileMenuItems, setProfileMenuItems] = useState(new Array<IContextualMenuItem>());
    const { AuthService }  = useContext(ApplicationContext);

    const onShowContextualMenu = React.useCallback((ev: React.MouseEvent<HTMLElement>) => {
        ev.preventDefault(); // don't navigate
        setShowContextualMenu(true);
      }, []);
    const onHideContextualMenu = React.useCallback(() => setShowContextualMenu(false), []);

    useEffect(() => {
        AuthService.addLoginHandler(() => initializeProfile(AuthService, setProfileName, setProfilePicture, setProfileMenuItems));
    }, [AuthService])

    useEffect(() => {
        initializeProfile(AuthService, setProfileName, setProfilePicture, setProfileMenuItems);
    }, [AuthService, setProfileName, setProfilePicture]);

    return (

        <Stack horizontal className={className} tokens={{ childrenGap: 3 }}>
            <Stack.Item className='w-8 h-8' mx-3 >
                <Link to="/">
                    <img
                        src="./logo.svg"
                        alt="Twin Viewer"
                    />
                </Link>
            </Stack.Item>


            {navigation.map((item: INavItem, idx: number) => (<NavItem key={idx} item={item} />))}

            <Stack.Item className='w-auto mx-3' grow={3} >
                <NavSearch />
            </Stack.Item>

            <Stack.Item className='mx-3'>
                <button ref={profileRef} onClick={onShowContextualMenu} className="bg-gray-800 rounded-full flex text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                    <span className="sr-only">Open user menu</span>
                    {profilePicture.length > 0 && <img className="h-8 w-8 rounded-full" src={profilePicture} alt={profileName} />}
                    {profilePicture.length === 0 && <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-500">
                        <span className="text-sm font-medium leading-none text-white">{profileName}</span>
                    </span>}
                </button>
            </Stack.Item>

            <ContextualMenu
                items={profileMenuItems}
                hidden={!showContextualMenu}
                target={profileRef}
                onItemClick={onHideContextualMenu}
                onDismiss={onHideContextualMenu}
            />

        </Stack>

    );


}
