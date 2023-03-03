import { isSaasBuild } from '../../services/BaseService';

export default function LoginPage() {
  // TODO: check if user is logged in in before route hook

  if (isSaasBuild) {
    window.location.href = process.env.REACT_APP_ACCOUNT_DASHBOARD_LOGIN_URL as string;
    return;
  }

  return <>login page</>;
}
