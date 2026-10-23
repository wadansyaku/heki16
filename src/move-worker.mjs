import app from './worker.mjs';

export function migrationResponse(request, destination) {
  const url=new URL(request.url);
  // Keep the old cookie and local records reachable long enough to recover them.
  const retained=url.pathname.startsWith('/api/') || url.pathname==='/' && url.searchParams.get('records')==='1' || /\.(?:mjs|css|svg|txt|json)$/.test(url.pathname);
  if (retained) return null;
  const next=new URL(url.pathname+url.search,destination);
  return new Response(null,{status:302,headers:{Location:next.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}

export default {
  async fetch(request,env,ctx) {
    return migrationResponse(request,'https://kuseiro.com') || app.fetch(request,env,ctx);
  }
};
