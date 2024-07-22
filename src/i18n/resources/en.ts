import { LanguageResource } from '../type';

export const en: LanguageResource = {
  common: {
    hello: 'Hello',
    hosts: 'Hosts',
    or: 'OR',
    here: 'HERE',
    reason: 'Reason',
    licensedashboard: 'Licence dashboard',
  },
  auth: {
    login: 'Login',
    signup: 'Sign Up',
    terms5: 'By signing up you agree to our',
    'signup-via-invite': 'Sign up via invite',
    'invalid-invite': 'Invalid invite code',
    'signup-with-sso': 'Sign up with SSO',
    'signup-with-password': 'Sign up with password',
  },
  signin: {
    signin: 'Sign in',
    rememberme: 'Remember me',
    forgotpassword: 'Forgot password?',
    signup: 'Sign up',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    'confirm-password': 'Confirm Password',
    terms1: 'By signing in you agree to our',
    terms2: 'Terms of Service',
    terms3: 'and',
    terms4: 'Privacy Policy',
    sso: 'Login with SSO',
    or: 'or',
  },
  error: {
    servermalfunction: 'Error server malfunction',
    contactyourserveradmin: 'Contact your server admin or check your network settings',
    billingerroroccured: 'Billing/Payment error occured',
    checkbillingsetting: "Check your tenant's billing settings in the",
  },
  info: {
    connectmultiplehosts: 'Connect multiple hosts',
    connectatleasttwohostsonanetworktobegincommunication:
      'Connect at least two hosts on a network to begin communication',
  },
  hosts: {
    connectahost: 'Connect a host',
  },
};
