import { AuthenticationParameters, Configuration, InteractionRequiredAuthError, UserAgentApplication } from 'msal';
import { IAuthService, IEnvironmentToConstantMapping } from '@microsoft/iot-cardboard-js';

export default class AppMsalAuthService implements IAuthService {
  private getTokenCalls = new Array<any>();
  private gettingToken = false;
  private isLoggingIn = true;
  private executeGetTokenSequentially = true;
  private authContextConfig;
  public authContext;

  private loginCallbacks = new Array<Function>();

  public addLoginHandler = (callback: Function) => {
    this.loginCallbacks.push(callback);
  }

  private environmentToConstantMapping: IEnvironmentToConstantMapping = {
    authority: 'https://login.microsoftonline.com/organizations',
    clientId: '[no-client-id]',
    scope: 'https://api.timeseries.azure.com/.default',
    redirectUri: window.location.protocol + '//' + window.location.hostname
  };

  constructor(environmentToConstantMapping?: IEnvironmentToConstantMapping) {
    this.environmentToConstantMapping =
      environmentToConstantMapping || this.environmentToConstantMapping;

    this.authContextConfig = {
      auth: {
        clientId: this.environmentToConstantMapping.clientId,
        authority: `${this.environmentToConstantMapping.authority}`,
        redirectUri: this.environmentToConstantMapping.redirectUri,
        navigateToLoginRequestUrl: true
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: true
      }
    } as Configuration;
    this.authContext = new UserAgentApplication(
      this.authContextConfig
    );
  }

  public context = () => this.authContext;

  public isLoginInProgress = () => this.isLoggingIn;

  public acquireTokenSilent = async (scopes: string[]) => await this.authContext.acquireTokenSilent({ scopes: scopes });

  public login = () => {

    this.isLoggingIn = true;

    const accounts = this.authContext.getAllAccounts();
    if (accounts.length) {
      this.isLoggingIn = false;
      this.shiftAndExecuteGetTokenCall();
    } else {
      this.authContext
        .loginPopup()
        .then(() => {
          // In case multiple accounts exist, you can select
          this.isLoggingIn = false;
          this.shiftAndExecuteGetTokenCall();
          this.loginCallbacks.forEach(callback => {
            try {
              callback();

            } catch (e) {
              console.log(e);
            }
          });
        })
        .catch((error: any) => {
          alert(error);
        });
    }
  };

  private logout = () => {
    this.authContext.logout();
  };

  private shiftAndExecuteGetTokenCall = () => {
    const call = this.getTokenCalls.shift();
    if (call) {
      call.call();
    }
  };

  private createGetTokenCall = (
    scope: AuthenticationParameters,
    resolve: (arg0: any) => void,
    reject: any,
    allowParallelGetTokenAfterComplete: boolean
  ) => {
    if (process.env.REACT_APP_clientId === '[aad-client-id]') { // Don't crash
      return null;
    }

    const resolveToken = (p: { accessToken: any; }) => {
      if (allowParallelGetTokenAfterComplete) {
        this.executeGetTokenSequentially = false;
      }
      this.gettingToken = false;
      resolve(p.accessToken);
      this.shiftAndExecuteGetTokenCall();
    };

    return () => {
      this.gettingToken = true;
      this.authContext
        .acquireTokenSilent(scope)
        .then(resolveToken)
        .catch((error: any) => {
          console.log(error);
          if (error instanceof InteractionRequiredAuthError) {
            // popups are likely to be blocked by the browser
            // notify the user that they should enable them
            alert('Some authentication flows will require pop-ups, please make sure popups are enabled for this site.');
            return this.authContext
              .acquireTokenPopup(scope)
              .catch((error: any) => {
                alert(error);
                reject(error);
              });

          }
          return reject(error);
        });
    };
  };

  private getGenericTokenPromiseCallback = (
    scope: AuthenticationParameters,
    allowParallelGetTokenAfterComplete = false
  ) => {
    scope.authority = `${this.environmentToConstantMapping.authority}`;
    return (resolve: any, reject: any) => {
      const getTokenCall = this.createGetTokenCall(
        scope,
        resolve,
        reject,
        allowParallelGetTokenAfterComplete
      );
      this.getTokenCalls.push(getTokenCall);
      if (
        (!this.gettingToken || !this.executeGetTokenSequentially) &&
        !this.isLoggingIn
      ) {
        this.shiftAndExecuteGetTokenCall();
      }
    };
  };

  public getToken = (tokenFor?: 'azureManagement' | 'adx' | 'storage') => {
    let scope;
    if (tokenFor === 'azureManagement') {
      scope = 'https://management.azure.com//.default';
      return new Promise(
        this.getGenericTokenPromiseCallback(
          {
            scopes: [scope]
          },
          true
        )
      ) as Promise<string>;
    } else if (tokenFor === 'adx') {
      scope = 'https://help.kusto.windows.net/user_impersonation';
      return new Promise(
        this.getGenericTokenPromiseCallback(
          {
            scopes: [scope]
          },
          true
        )
      ) as Promise<string>;
    } else if (tokenFor === 'storage') {
      scope = 'https://storage.azure.com/user_impersonation';
      return new Promise(
        this.getGenericTokenPromiseCallback(
          {
            scopes: [scope]
          },
          true
        )
      ) as Promise<string>;
    } else {
      scope = this.environmentToConstantMapping.scope;
      return new Promise(
        this.getGenericTokenPromiseCallback({
          scopes: [scope]
        })
      ) as Promise<string>;
    }
  };
}

