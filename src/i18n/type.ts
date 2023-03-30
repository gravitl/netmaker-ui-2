export interface LanguageResource {
  common: {
    hello: string;
    hosts: string;
  };
  signin: {
    signin: string;
    rememberme: string;
    forgotpassword: string;
    signup: string;
    logout: string;
    username: string;
    password: string;
    terms1: string;
    terms2: string;
    terms3: string;
    terms4: string;
    sso: string;
    or: string;
  };
  error: {
    servermalfunction: string;
    contactyourserveradmin: string;
  };
  info: {
    connectonemorehost: string;
    connectatleasttwohostsonanetworktobegincommunication: string;
  };
  hosts: {
    connectahost: string;
  };
}
