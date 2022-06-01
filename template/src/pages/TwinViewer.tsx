
import { ADT3DViewer, Theme } from '@microsoft/iot-cardboard-js';
import React, { useContext } from 'react';
import { ApplicationContext } from '../App';

export interface ITwinViewerProps {
  className?: string;
}

export const TwinViewer: React.FC<ITwinViewerProps> = ({ className }) => {
  const {ADT3DSceneAdapter, config} = useContext(ApplicationContext);
  return (
    <div className={className}>
      <ADT3DViewer
        scenesConfig={config as any}
        sceneId={process.env.REACT_APP_SCENEID}
        pollingInterval={10000}
        title="3D Viewer"
        theme={Theme.Kraken}
        adapter={ADT3DSceneAdapter}
      />
    </div>
  );
}
