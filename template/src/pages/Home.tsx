import { ADT3DGlobe, IBlobAdapter, Theme } from '@microsoft/iot-cardboard-js';
import React, { useContext } from 'react';
import { ApplicationContext } from '../App';

export interface IHomeProps {
  className?: string;
}

export const Home: React.FC<IHomeProps> = ({ className }) => {
  const app = useContext(ApplicationContext);
  return (
    <div className={`h-full ${className}`}>
      <ADT3DGlobe
        title="3D Viewer"
        theme={Theme.Kraken}
        adapter={app.ADT3DSceneAdapter as IBlobAdapter}
      />
    </div>
  );
}
