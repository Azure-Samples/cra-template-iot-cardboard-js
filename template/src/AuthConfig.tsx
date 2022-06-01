import { IEnvironmentToConstantMapping } from "@microsoft/iot-cardboard-js";

export function getReplyUrl() {
    const url = new URL(window.location.href);
    let protocol = url.protocol;
    if (url.host.indexOf('localhost') < 0) {
        protocol = 'https:';
    }
    const ret = protocol + '//' + url.host + '/';
    return ret;
}
 
const MsalConfig:IEnvironmentToConstantMapping = {
    authority: process.env.REACT_APP_authority ?? "your-authority",
    clientId: process.env.REACT_APP_clientId ?? "your-client-id",
    scope: "https://digitaltwins.azure.net/.default",
    redirectUri: getReplyUrl()
}

export default MsalConfig;
