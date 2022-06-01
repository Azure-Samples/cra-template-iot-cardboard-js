import { models, Page, Report, service } from "powerbi-client";
import AppMsalAuthService from "../services/AppMsalAuthService";

export interface IDataPoint {
	identity: [{
		equals: string;
		target: {
			table: string;
			column: string;
		}
	}];
	values: [{
		formattedValue: string;
		target: {
			$schema: string;
			aggregationFunction: string;
			column: string;
			table: string;
		}
	}];
}

export interface IDataSelectedEvent {
	report: Report;
	page: Page;
	visual: models.IVisual;
	dataPoints: IDataPoint[];
}

export interface IButtonClickedEvent {
	id: string;
	title: string;
	type: string;
	bookmark: string;
}

export type DataSelectedHandler = (event?: service.ICustomEvent<IDataSelectedEvent>) => void;
export type ButtonClickedHandler = (event?: service.ICustomEvent<IButtonClickedEvent>) => void;

export interface IEmbedPowerBIProps {
  auth: AppMsalAuthService,
  embedUrl?: string;
	width: number;
	height: number;
	hideSensitivity?: boolean;
	dontUseREST?: boolean;
	hideRefresh?: boolean;
	params?: object;
	onClose?: ()=>void;
	onDataSelected?: DataSelectedHandler;
	onButtonClicked?: ButtonClickedHandler;
}
