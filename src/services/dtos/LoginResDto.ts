export interface LoginResDto {
  Code: number;
  Message: string;
  Response: {
    UserName: string;
    AuthToken: string;
  };
}
