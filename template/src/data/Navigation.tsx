export interface INavItem {
  id: string;
  name: string;
  displayName: string;
  href: string;
}

const Navigation: INavItem[] = [
  {
    id: "0",
    name: "Home",
    displayName: "Home",
    href: "home",
  },
  {
    id: "1",
    name: "TwinViewer",
    displayName: "Twin Viewer",
    href: "twinViewer",
  },
  {
    id: "3",
    name: "TwinBuilder",
    displayName: "Twin Builder",
    href: "twinBuilder",
  },
  {
    id: "4",
    name: "PowerBI",
    displayName: "Power BI",
    href: "powerBI",
  },
];

export default Navigation;
