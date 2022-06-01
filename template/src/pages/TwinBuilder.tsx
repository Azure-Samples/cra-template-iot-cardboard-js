import { ADT3DScenePage, Theme } from '@microsoft/iot-cardboard-js';
import React, { useContext } from 'react';
import { ApplicationContext } from '../App';
export interface IHomeProps {
  className?: string;
}

export const TwinBuilder: React.FC<IHomeProps> = ({ className }) => {
  const {ADT3DSceneAdapter} = useContext(ApplicationContext);
  return (
    <div className={className}>
      <ADT3DScenePage
        title="3D Viewer"
        theme={Theme.Kraken}
        adapter={ADT3DSceneAdapter}
      />
    </div>
  );
}
