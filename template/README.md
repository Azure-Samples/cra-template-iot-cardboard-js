# IoT Cardboard Application

A React Application created using create react template for [@microsoft/iot-cardboard-js](https://www.npmjs.com/package/@microsoft/iot-cardboard-js)

This application contains 4 pages (configured as routes used in the [MainPanel](./src/components/MainPanel.tsx) components).

- [Home](./src/pages/Home.tsx)
- [TwinViewer](./src/pages/TwinViewer.tsx)
- [TwinBuilder](./src/pages/TwinBuilder.tsx)
- [PowerBI](./src/pages/PowerBI.tsx)

You can add your own [pages](./src/pages/) to the application by adding them to the [navigation](./src/data/Navigation.tsx) file and adding references to the page components in the [MainPanel](./src/components/MainPanel.tsx).

You may want to use PowerBI to do reporting on Azure Data Explorer (ADX) data, so see the included a PowerBI component to help with that.

See this link for enabling [ADX historisation](https://docs.microsoft.com/en-us/azure/digital-twins/how-to-use-data-history)  
You can also [query ADT from Kusto](https://docs.microsoft.com/en-us/azure/digital-twins/concepts-data-explorer-plugin)  
And use [Grafana with ADX](https://techcommunity.microsoft.com/t5/internet-of-things-blog/creating-dashboards-with-azure-digital-twins-azure-data-explorer/ba-p/3277879)  
Check out the [International Space Station demo](https://docs.microsoft.com/en-us/shows/internet-of-things-show/model-and-track-the-international-space-station-with-azure-digital-twins-and-data-explorer)



## Getting Started

Before running the application you will need to populate the [environment variables](#env-file-parameters) in the .env file.

To run this project in dev mode, run the following command:

```cmd
npm start
```
This will start the application in development mode (http://localhost:3000).

## Scripts

Inside this directory run using npm or yarn:

**start** - runs the app in the development mode. Open http://localhost:3000 to view it in the browser.  
**test** - launches the test runner in the interactive watch mode.  
**build** - builds the app for production to the [./server/build](./server/build) folder.  
**eject** - exposes content of react-script package  


## .env file parameters

| Parameter | Description |
|-----------|-------------|
| REACT_APP_authority | The authority URL for the Azure AD tenant, e.g. https://login.microsoftonline.com/**[tenant guid]** |
| REACT_APP_clientId | The client ID of the application for the Application Registration |
| REACT_APP_TITLE | The title of the application. |
| REACT_APP_BLOB_URL | The URL of the blob storage account, e.g. https://**myblob**.blob.core.windows.net/**mycontainer** |
| REACT_APP_ADT_HOST | The host name of the Azure AD Digital Twins service, e.g. **mydigitaltwin**.digitaltwins.azure.net   |
| REACT_APP_SCENEID | The ID of the scene to show in the viewer. |
| REACT_APP_EMBED_URL | The URL of a Power BI embed. |

## User Permissions

Your access control role assignments for your storage account should be:

- Azure Digital Twins Data
- Contributor or Reader
- Optionally Owner if you want cardboard to automatically update permissions

:warning: Note that Owner without Reader/Contributor is **not** sufficient, you need Reader or Contributor

You will also need to enable CORS on your storage account as the 3D models are fetched without the proxy


## Azure Active Directory Settings

In order for the application to work, you need have a valid Azure Active Directory App Registration.

The Application needs to have the following **Web** redirect URI:

```
https://localhost:3000
```

The Application requires the following api permissions set:

| Service | Permission | Type | Description |
|---------|-----------|------|-------------|
|Azure Data Explorer | user_impersonation       | Delegated | Access Azure Data Explorer |
|Azure Digital Twins | Read.Write               | Delegated | Access Azure Digital Twins |
|Azure Storage       | user_impersonation       | Delegated | Access Azure Storage |
|Microsoft Graph     | User.Read                | Delegated | Sign in and read user profile |

:warning: Some of these permissions may require admin consent in your organisation. :warning:

The Permissions below are only required to use Power BI

| Service | Permission | Type | Description |
|---------|-----------|------|-------------|
|Power BI Service    | App.Read.All             | Delegated | View all Power BI apps |
|Power BI Service    | Capacity.Read.All        | Delegated | View all capacities |
|Power BI Service    | Dashboard.Read.All       | Delegated | View all dashboards |
|Power BI Service    | Dataflow.Read.All        | Delegated | View all dataflows |
|Power BI Service    | Dataset.Read.All         | Delegated | View all datasets |
|Power BI Service    | Gateway.Read.All         | Delegated | View all gateways |
|Power BI Service    | Report.Read.All          | Delegated | View all reports |
|Power BI Service    | StorageAccount.Read.All  | Delegated | View all storage accounts |
|Power BI Service    | Workspace.Read.All       | Delegated | View all workspaces |

## Deployment

Azure Digital Twins (ADT) has a CORS restriction that means browser apps cannot directly make HTTP requests to it.

This application a /server folder which is used as the client build output and can be deployed directly to Azure. The folder includes a node.js passthru proxy server, which proxies client requests to ADT via the backend avoiding CORS.
You should create an Azure WebApp using Node 16 LTS, and set the SCM_DO_BUILD_DURING_DEPLOYMENT=true Application Setting on it.
This causes the post-deployment build steps to run (including npm install) so you should not deploy /server/node_modules
There are no other build steps for /server (no Webpack)

Alex Hayward & Paul Tallett, Microsoft UK, May 2022
