const BASE_URL = "https://lightslategray-horse-496166.hostingersite.com/public/api/v1";
const buildQueryUrl = (base, params) => {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v);
    if (!s) return;
    qs.set(k, s);
  });
  const query = qs.toString();
  return `${base}${query ? `?${query}` : ""}`;
};

export const API = {
  GET_FIELD_OPTIONS: `${BASE_URL}/ad-copy/options?field_type=all`,
  GENERATE_AD_COPY: `${BASE_URL}/ad-copy/generate`,
  GENERATE_AD_COPY_CLAUDE_STREAM: `${BASE_URL}/ad-copy/generate-claude-stream`,
  GET_VARIANTS_LOG: (requestId) => `${BASE_URL}/ad-copy/${requestId}/variants`,
  REGENERATE_VARIANT: (variantId) => `${BASE_URL}/ad-copy/variants/${variantId}/regenerate`,

  CAPTION_HASHTAG_GET_FIELD_OPTIONS: `${BASE_URL}/caption-hashtag/options?field_type=all`,
  CAPTION_HASHTAG_GENERATE: `${BASE_URL}/caption-hashtag/generate`,
  CAPTION_HASHTAG_GENERATE_STREAM: `${BASE_URL}/caption-hashtag/generate-caption-claude-stream`,
  CAPTION_HASHTAG_GET_VARIANTS_LOG: (requestId) => `${BASE_URL}/caption-hashtag/${requestId}/variants`,
  CAPTION_HASHTAG_REGENERATE_VARIANT: (variantId) => `${BASE_URL}/caption-hashtag/variants/${variantId}/regenerate`,

  GET_COPYWRITING_OPTIONS: `${BASE_URL}/copy-writing/options?field_type=all`,
  GENERATE_COPYWRITING: `${BASE_URL}/copy-writing/generate`,
  GENERATE_COPYWRITING_STREAM: `${BASE_URL}/copy-writing/generate-claude-stream`,
  REGENERATE_COPYWRITING_VARIANT: (variantId) => `${BASE_URL}/copy-writing/variants/${variantId}/regenerate`,
  COPYWRITING_GET_VARIANTS_LOG: (requestId) => `${BASE_URL}/copy-writing/${requestId}/variants`,

  SCRIPT_WRITER_GET_OPTIONS: `${BASE_URL}/script-writer/options?field_type=all`,
  SCRIPT_WRITER_GENERATE: `${BASE_URL}/script-writer/generate`,
  SCRIPT_WRITER_GENERATE_STREAM: `${BASE_URL}/script-writer/generate-claude-stream`,

  EMAIL_GENERATE: `${BASE_URL}/email/generate`,
  EMAIL_NEWSLETTER_GENERATE_STREAM: `${BASE_URL}/email-newsletter/generate-stream`,
  EMAIL_NEWSLETTER_OPTIONS: `${BASE_URL}/email-newsletter/options?field_type=all`,

  SEO_KEYWORD_OPTIONS: `${BASE_URL}/seo-keyword/options?field_type=all`,
  SEO_KEYWORD_GENERATE_STREAM: `${BASE_URL}/seo-keyword/generate-stream`,

  PROFILE: `${BASE_URL}/profile`,
  SUBSCRIPTION_PLANS: `${BASE_URL}/subscriptions/plans`,
  SUBSCRIPTION_CHECKOUT: `${BASE_URL}/subscriptions/checkout`,
  SUBSCRIPTION_CONFIRM: `${BASE_URL}/subscriptions/confirm`,
  SUBSCRIPTION_STATUS: (subscriptionReference) =>
    buildQueryUrl(`${BASE_URL}/subscriptions/status`, { subscription_reference: subscriptionReference }),
  SUBSCRIPTION_HISTORY: ({ perPage = 15, page = 1 } = {}) =>
    buildQueryUrl(`${BASE_URL}/subscriptions/history`, { per_page: perPage, page }),
  AD_COPY_HISTORY: ({ perPage = 100, page = 1, from, to } = {}) =>
    buildQueryUrl(`${BASE_URL}/ad-copy/history`, { per_page: perPage, page, from, to }),

  CAPTION_HASHTAG_HISTORY: ({ perPage = 100, page = 1, from, to } = {}) =>
    buildQueryUrl(`${BASE_URL}/caption-hashtag/history`, { per_page: perPage, page, from, to }),
  COPYWRITING_HISTORY: ({ perPage = 100, page = 1, from, to } = {}) =>
    buildQueryUrl(`${BASE_URL}/copy-writing/history`, { per_page: perPage, page, from, to }),
  SCRIPT_WRITER_HISTORY: ({ perPage = 100, page = 1, from, to } = {}) =>
    buildQueryUrl(`${BASE_URL}/script-writer/history`, { per_page: perPage, page, from, to }),
  EMAIL_NEWSLETTER_HISTORY: ({ perPage = 100, page = 1, from, to } = {}) =>
    buildQueryUrl(`${BASE_URL}/email-newsletter/history`, { per_page: perPage, page, from, to }),
  SEO_KEYWORD_HISTORY: ({ perPage = 100, page = 1, from, to } = {}) =>
    buildQueryUrl(`${BASE_URL}/seo-keyword/history`, { per_page: perPage, page, from, to }),

  AUTH_LOGIN: `${BASE_URL}/auth/login`,
  AUTH_GOOGLE: `${BASE_URL}/auth/google`,
  AUTH_REGISTER: `${BASE_URL}/auth/register`,

  DASHBOARD_STATS: `${BASE_URL}/dashboard/stats`,
  DASHBOARD_CREDIT_USAGE: `${BASE_URL}/dashboard/credit-usage`,
  DASHBOARD_MOST_USED_TOOL: `${BASE_URL}/dashboard/most-used-tool`,
  DASHBOARD_ACTIVITY_LOGS: `${BASE_URL}/dashboard/activity-logs`,
};

export default API;
