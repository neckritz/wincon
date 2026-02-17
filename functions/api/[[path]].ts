interface Env {
  CR_API_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;

  const pathParam = params.path;
  const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam ?? '';

  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(`https://proxy.royaleapi.dev/v1/${path}`);
  upstreamUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${env.CR_API_KEY.replace(/\s+/g, '')}`);

  const upstreamRequest = new Request(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  });

  return fetch(upstreamRequest);
};
