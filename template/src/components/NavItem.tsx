import { Stack } from "@fluentui/react";
import { Link, useLocation } from "react-router-dom";
import { INavItem } from "../data/Navigation";

export interface INavItemProps {
    item: INavItem;
}


export const NavItem: React.FC<INavItemProps> = ({item}) => {
    const location = useLocation();
    const match = location.pathname.endsWith(item.href);
    return (
        <Stack.Item key={item.name+item.href} className={`mx-3 px-3 py-2 rounded-md text-sm font-medium text-white  ${(match) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} aria-current={match ? 'page' : undefined}>
            <Link
            key={item.name}
            to={item.href}>  {item.displayName}</Link>
        </Stack.Item>
        
    );
}