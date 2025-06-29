// export interface WeatherEvent {
//   id?: number;
//   city: string;
//   timestamp: string;

//   temperature: number;

//   created_at?: string;
//   updated_at?: string;
// }

export type CityId = string & { readonly brand: unique symbol };


export interface WeatherEvent {
  city: CityId;
  timestamp: string;
  temperature: number;
  windspeed: number;
  winddirection: number;
}