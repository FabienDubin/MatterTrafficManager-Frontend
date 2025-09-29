export interface Client {
  id: string;
  name: string;
}

export interface ClientsResponse {
  success: boolean;
  data: Client[];
  count: number;
  timestamp: string;
}

export interface ClientColorsResponse {
  success: boolean;
  data: Record<string, string>; // { clientId: hexColor }
  timestamp: string;
}

export interface UpdateClientColorsRequest {
  colors: Record<string, string>;
}

export interface UpdateClientColorsResponse {
  success: boolean;
  message: string;
  data: Record<string, string>;
  timestamp: string;
}