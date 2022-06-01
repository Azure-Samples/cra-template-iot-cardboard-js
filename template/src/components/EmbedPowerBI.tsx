//
// This component embeds a PowerBI report. The embed URL should contain ctid query string from powerbi.com - don't build your own url
//
// Its actually two components in one. It first tries to get a token for the PowerBI REST API, then uses powerbi-client to embed
// If the token call fails (or dontUseREST is set), it uses an iframe with autoAuth=true which requires the user to login (no SSO)
// To use the REST API, your appId must have the Power BI Service: Report.Read.All delegated permission
// This permission does not require admin approval by default, but DOES in some organisations (eg Microsoft Corp tenant)
// Embed url's in the Microsoft tenant start with msit.powerbi.com
// Also if you are in the Microsoft Corp tenant, the REST API is disabled for your appId by default even if API permissions are granted
// Go here https://microsoft.sharepoint.com/sites/microsoft365builders/sitepages/power%20platform%20gov/power-bi-rest-apis.aspx
//
// If your admins have enabled report sensitivity tagging, there's no proper way to turn this off
// Set hideSensitivity and this component will chop 40px off the top of the report
//
// It exposes two events, onDataSelected and onButtonClicked. I couldn't find a way to get hover interactions
//
// You can also pass parameters to the report. params={{ anything: value }}. This will subsitute ${anything} in the report URL.
// If the report url contains ${something} and you don't pass a value for "something", the report will not be rendered.
//
// Took about a month to get fully working
// Paul Tallett, May-2022
//

import { Embed, factories, models, Report, service } from 'powerbi-client';
import React, { useEffect, useRef, useState } from 'react';
import { IDataPoint, IEmbedPowerBIProps } from './EmbedPowerBI.interfaces';
import { IconButton } from '@fluentui/react';

const powerbi = new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);

export function UUID(): string {
  const nbr = Math.random();
  let randStr = '';
  do {
    randStr += nbr.toString(16).substr(2);
  } while (randStr.length < 30);

  // tslint:disable-next-line: no-bitwise
  return [randStr.substr(0, 8), '-', randStr.substr(8, 4), '-4', randStr.substr(12, 3), '-', (((nbr * 4) | 0) + 8).toString(16),
      randStr.substr(15, 3), '-', randStr.substr(18, 12),].join('');
}

export const getIdentity = (dataPoints: IDataPoint[], column: string) => {
  let val;
  if (dataPoints) {
    for (const data of dataPoints) {
      for (const identity of data.identity) {
        if (identity.target.column === column)
          val = identity.equals;
      }
    }
  }

  return val;
}

export const getValue = (dataPoints: IDataPoint[], column: string) => {
  let val;
  if (dataPoints) {
    for (const data of dataPoints) {
      for (const v of data.values) {
        if (v.target.column === column)
          val = v.formattedValue;
      }
    }
  }

  return val;
}

export const EmbedPowerBI: React.FC<IEmbedPowerBIProps> = ({ auth, onDataSelected, onButtonClicked, embedUrl, width, height, hideSensitivity, params, dontUseREST, hideRefresh }) => {
  const onDataSelectedRef = useRef<any>();
  const onButtonClickedRef = useRef<any>();
  const frameId = useRef(UUID());
  const prevParamsRef = useRef('');
  const prevUrlRef = useRef('');
  const [alternateEmbedMethod, setAlternateEmbedMethod] = useState(!!dontUseREST);
  const reportRef = useRef<Report>(null);

  onDataSelectedRef.current = onDataSelected;
  onButtonClickedRef.current = onButtonClicked;

  const [reportConfig, setReportConfig] = useState<models.IReportEmbedConfiguration>({
    type: 'report',
    embedUrl: undefined,
    tokenType: models.TokenType.Aad,
    accessToken: undefined,
    settings: {
      navContentPaneEnabled: false,
      panes: {
        filters: {
          expanded: false,
          visible: false
        }
      }
    }
  });
  

  const onDataSelect = (e: any) => {
    if (onDataSelectedRef.current) {
      onDataSelectedRef.current({ detail: e.detail });
    }
  }

  const onButtonClick = (e: any) => {
    if (onButtonClickedRef.current) {
      onButtonClickedRef.current({ detail: e.detail });
    }
  }

  useEffect(() => {
    const isIframe = (window !== window.parent && !window.opener);     // Don't call when in hidden login iframe
    if (!alternateEmbedMethod && !isIframe) {
      const p = JSON.stringify(params || {});
      if (prevParamsRef.current !== p) {
        prevParamsRef.current = p;
        let url = embedUrl.replace('&autoAuth=true', '');
        let hideThisReport = false;
        if (params) {
          for (const p in params) {
            let pattern = '${' + p + '}';
            const newUrl = url.replace(pattern, params[p]).replaceAll(pattern, params[p]);

            if (newUrl !== url && !params[p]) {
              hideThisReport = true;
            }
            url = newUrl;
          }
        }

        if (!hideThisReport) {
          auth.acquireTokenSilent(['https://analysis.windows.net/powerbi/api/Report.Read.All']).then((response) => {
            const token = response.accessToken;
            const config = {
              ...reportConfig,
              embedUrl: url,
              accessToken: token
            };

            setReportConfig(config);
          }
          ).catch((err) => {
            console.log(err);
            setAlternateEmbedMethod(true);
          })
        } else {
          const config = {
            ...reportConfig,
            embedUrl: ''
          };

          setReportConfig(config);
        }
      }
    }
    // eslint-disable-next-line
  }, [embedUrl, params]);

  useEffect(() => {
    if (!alternateEmbedMethod) {
      let report: Embed = null;
      if (reportConfig.embedUrl && prevUrlRef.current !== reportConfig.embedUrl) {
        prevUrlRef.current = reportConfig.embedUrl;
        report = powerbi.embed(document.getElementById(frameId.current), reportConfig);
        reportRef.current = report as Report;
        if (!report.iframeLoaded) {
          report.off('dataSelected');
          report.on('dataSelected', (e) => onDataSelect(e));
          report.off('buttonClicked');
          report.on('buttonClicked', (e) => onButtonClick(e));
        }
      }
    }

    return () => {
      //
    };

  }, [reportConfig, frameId, alternateEmbedMethod]);

  const refresh = () => {
    reportRef.current?.refresh().catch(() => { });
  }

  // This is only used with the alternate method using an iFrame (if we can't get a PBI token - appId permissions)
  function onload(e: any) {
    const childWindow = e.target.contentWindow;
    window.addEventListener('message', (message) => {
      if (message.source !== childWindow) {
        return; // Skip message in this event listener
      }

      // console.log(message);

      const url: string = message.data.url;
      let action = '';
      if (url) {
        action = url.substring(url.lastIndexOf('/') + 1);
      }
      // console.log(message.data?.body, action);
      if (action === 'dataSelected' && onDataSelectedRef.current) {
        onDataSelectedRef.current({ detail: message.data?.body } as any);
      } else if (action === 'buttonClicked' && onButtonClickedRef.current) {
        onButtonClickedRef.current({ detail: message.data?.body } as any);
      }
    });
  }

  // Can't get a token to PBI REST API - fallback to iframe
  const alternateRender = () => {
    let url = embedUrl + `&filterPaneEnabled=false&navContentPaneEnabled=false`;
    if (url.toLowerCase().indexOf('autoauth') === -1) {
      url += '&autoAuth=true';
    }

    let hideThisReport = false;
    if (params) {
      for (const p in params) {
        let pattern = '${' + p + '}';
        const parm: any = (params as any)[p];
        const newUrl = url.replaceAll(pattern, parm);
        if (newUrl !== url && !parm) {
          hideThisReport = true;
        }
        url = newUrl;
      }
    }
  
    // Hide the sensitivity bar
    const h = hideSensitivity ? 40 : 0;
    if (!hideThisReport) {
      return (
        <div style={{ width: width, height: height, overflow: 'hidden' }}>
          <iframe
            id={frameId.current}
            title=" "
            width={width}
            height={height + h + 35}
            src={url}
            frameBorder={0}
            style={{ marginTop: -h, marginBottom: -h - 35 }}
            onLoad={onload}
          />
        </div>
      );
    } else {
      return null;
    }
  };

  if (!embedUrl) {
    return null;
  }

  if (!alternateEmbedMethod) {
    // Hide the sensitivity bar
    const h = hideSensitivity ? 45 : 0;
    const o = reportConfig.embedUrl ? '1' : '0';
    return (
      <div style={{ width: width - 5, height: height - h - 35, opacity: o, overflow: 'hidden', position: 'relative' }}>
        <div id={frameId.current} style={{ width: width, height: height, marginTop: -h, marginBottom: -70, marginLeft: -5 }} />
        {!hideRefresh && <IconButton iconProps={{ iconName: 'Refresh' }} className='right-2 top-[6px] absolute text-black bg-white ' onClick={() => refresh()} />}
      </div>
    );
  } else {
    return alternateRender();
  }
}
