import React, { useContext, useEffect, useRef, useState } from 'react';
import { ApplicationContext } from '../App';
import { EmbedPowerBI } from '../components/EmbedPowerBI';

export interface IPowerBIProps {
  className?: string;
}

export const PowerBI: React.FC<IPowerBIProps> = ({ className }) => {
  const { AuthService } = useContext(ApplicationContext);
  const divRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const embedUrl = process.env.REACT_APP_EMBED_URL;

  useEffect(() => {
    const w = divRef.current?.clientWidth;
    const h = divRef.current?.clientHeight;
    setSize({ w, h });
  }, []);

  if (!embedUrl || embedUrl === '[power-bi-embed-url]') {
    return null;
  }

  return (
    <div ref={divRef} className={'w-full h-full ' + (className || '')}>
      {!!size.w && !!size.h && <EmbedPowerBI auth={AuthService} embedUrl={embedUrl} width={size.w} height={size.h} />}
    </div>
  );
}
