export interface LinkFormData {
  webUrl: string;
  iosUrl: string | null;
  aosUrl: string | null;
  appOnly: boolean;
  expireDate: number;
}

export interface LinkData extends LinkFormData {
  key: string;
  registerName: string;
  registerEmail: string;
  registerDate: number;
}
