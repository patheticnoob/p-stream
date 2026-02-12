import {
  makeProviders,
  makeStandardFetcher,
  targets,
} from "@p-stream/providers";

import {
  makeLoadBalancedSimpleProxyFetcher,
  setupM3U8Proxy,
} from "@/backend/providers/fetchers";

setupM3U8Proxy();

export function getProviders() {
  setupM3U8Proxy();

  return makeProviders({
    fetcher: makeStandardFetcher(fetch),
    proxiedFetcher: makeLoadBalancedSimpleProxyFetcher(),
    target: targets.BROWSER,
  });
}

export function getAllProviders() {
  return makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.BROWSER,
  });
}
