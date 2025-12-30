const BASE_URL = "https://olive-gull-905765.hostingersite.com/public/api/v1";

export const API = {
  GET_FIELD_OPTIONS: `${BASE_URL}/ad-copy/options?field_type=all`,
  GENERATE_AD_COPY: `${BASE_URL}/ad-copy/generate`,
  AUTH_LOGIN: `${BASE_URL}/auth/login`,
  AUTH_GOOGLE: `${BASE_URL}/auth/google`,
  AUTH_REGISTER: `${BASE_URL}/auth/register`,

  DASHBOARD_STATS: `${BASE_URL}/dashboard/stats`,
  DASHBOARD_CREDIT_USAGE: `${BASE_URL}/dashboard/credit-usage`,
  DASHBOARD_MOST_USED_TOOL: `${BASE_URL}/dashboard/most-used-tool`,
  DASHBOARD_ACTIVITY_LOGS: `${BASE_URL}/dashboard/activity-logs`,
};

export default API;
