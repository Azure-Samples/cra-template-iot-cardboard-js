# cra-template-iot-cardboard-js

A Create React App template for the [@microsoft/iot-cardboard-js](https://github.com/microsoft/iot-cardboard-js) component library.

## Usage


To use this template with npm - run the following command:

```bash
npx create-react-app your-project-name --template iot-cardboard-js
```

or if you have local changes to the template use the local template (you can run this command anywhere as long as you have an explicit reference to the repository.) :

```bash

npx create-react-app your-project-name --template file:[local-path-to-this-repository]

```


## Scripts

Inside the project directory run using npm or yarn:

**create** - create a sample-twin-app  
**start** - runs the app in the development mode. Open http://localhost:3000 to view it in the browser.  
**test** - launches the test runner in the interactive watch mode.  
**build** - builds the app for production to the /server/build folder.  
**eject** - exposes content of react-script package  

The CRA template only supports react v17 for now.

You may want to use PowerBI to do reporting on Azure Data Explorer (ADX) data, so see the included PowerBI component to help with that.

See this link for enabling [ADX historisation](https://docs.microsoft.com/en-us/azure/digital-twins/how-to-use-data-history)  
You can also [query ADT from Kusto](https://docs.microsoft.com/en-us/azure/digital-twins/concepts-data-explorer-plugin)  
And use [Grafana with ADX](https://techcommunity.microsoft.com/t5/internet-of-things-blog/creating-dashboards-with-azure-digital-twins-azure-data-explorer/ba-p/3277879)  
Check out the [International Space Station demo](https://docs.microsoft.com/en-us/shows/internet-of-things-show/model-and-track-the-international-space-station-with-azure-digital-twins-and-data-explorer)

## Configuration

You need to update the created .env file with your environment:  

REACT_APP_authority=https://login.microsoftonline.com/**[tenant guid]**  
REACT_APP_clientId=**appId guid**  
REACT_APP_TITLE=Twin Viewer  

REACT_APP_BLOB_URL=https://**myblob**.blob.core.windows.net/**mycontainer**  
REACT_APP_ADT_HOST=**mydigitaltwin**.digitaltwins.azure.net  
REACT_APP_SCENEID=**sceneid-to-show-in-viewer**  
REACT_APP_EMBED_URL=**power-bi-embed-url**  

Note you need to add your container name to the BLOB URL, and there is no https:// on the ADT host name.

## Permissions

Your App Registration (appId) needs the following **delegated** permissions:  

- Azure Digital Twins: Read.Write
- Azure Storage: user_impersonation
- Microsoft Graph: User.Read

You may also want to add:  

- Azure Data Explorer: user_impersonation
- Power BI Service: Report.Read.All

if you intend to use those APIs. Some of these permissions may require admin consent in your organisation.

Your access control role assignments for your storage account should be:

- Azure Digital Twins Data
- Contributor or Reader
- Optionally Owner if you want cardboard to automatically update permissions

Note that Owner without Reader/Contributor is **not** sufficient, you need Reader or Contributor

You will also need to enable CORS on your storage account as the 3D models are fetched without the proxy

## Deployment

Azure Digital Twins (ADT) has a CORS restriction that means browser apps cannot directly make HTTP requests to it.
This template creates a /server folder which is used as the client build output and can be deployed directly to Azure.
The folder includes a node.js passthru proxy server, which proxies client requests to ADT via the backend avoiding CORS.
You should create an Azure WebApp using Node 16 LTS, and set the SCM_DO_BUILD_DURING_DEPLOYMENT=true Application Setting on it.
This causes the post-deployment build steps to run (including npm install) so you should not deploy /server/node_modules
There are no other build steps for /server (no Webpack)
