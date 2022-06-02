import { BrowserRouter as Router } from "react-router-dom";
import '@microsoft/iot-cardboard-js/themes.css';
import MainPanel from "./components/MainPanel";
import { Nav } from './components/Nav';
import { useEffect, useState, useRef } from 'react';
import Navigation from './data/Navigation';
import { ADT3DSceneAdapter } from '@microsoft/iot-cardboard-js';
import React from 'react';
import AppMsalAuthService from './services/AppMsalAuthService';
import Settings from "./AuthConfig"
import { initializeIcons, loadTheme } from '@fluentui/react';
import { Environment } from "./Environment";

export interface IApplicationContext {
  AuthService: AppMsalAuthService;
  ADT3DSceneAdapter: ADT3DSceneAdapter;
  config: any;
}

const authentication = new AppMsalAuthService(Settings);

export const ApplicationContext = React.createContext<IApplicationContext>(null);

function App() {
  const [navItems] = useState(Navigation);
  const [refreshConfig, setRefreshConfig] = useState(true);
  const [config, setConfig] = useState(null);
  const adapterRef = useRef<ADT3DSceneAdapter>(
    new ADT3DSceneAdapter(authentication, Environment.AdtHost(), Environment.BlobUrl()));
  
  useEffect(() => {
    initializeIcons();
    loadTheme({ palette: { themePrimary: '#F60045', themeDarkAlt: '#106EBE' }, semanticColors: {buttonBackground: 'white'} });
  }, []);

  useEffect(() => {
    if (refreshConfig) {
      adapterRef.current.getScenesConfig().then((result) => {
        let blobConfig: any = result.result?.data;
        if (!blobConfig) {
          if (window.location.href.indexOf('/builder') === -1) {
            window.location.href = '/builder';
          }
          return;
        }

        setConfig(blobConfig);
        setRefreshConfig(false);
      }).catch((e) => {
        console.log(e);
        if (window.location.href.indexOf('/builder') === -1) {
          window.location.href = '/builder';
        }
        return;
      })
    }
  }, [refreshConfig]);

  const appContext: IApplicationContext = {
    AuthService: authentication,
    ADT3DSceneAdapter: adapterRef.current,
    config
  };

  if (process.env.REACT_APP_clientId === '[aad-client-id]') {
    return <div>You need to update your .env file - see the README</div>;
  }

  return (
    <Router>
      <ApplicationContext.Provider value={appContext}>
        <div className="app dark-mode slate">
          <Nav navigation={navItems} className={"toolbar"} />
          <MainPanel Navigation={navItems} applicationContext={appContext} />
        </div>
      </ApplicationContext.Provider>
    </Router>
  );
}

export default App;
