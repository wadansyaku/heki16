const decoder=new TextDecoder();
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const keyCache=new Map();

// A trusted Access context or a verified Access JWT is required. Request email headers never authorize.
export async function adminIdentity(request,env,ctx={},transport=fetch,now=Date.now()) {
  const owner=env.ADMIN_EMAIL?.trim().toLowerCase(),audience=env.ACCESS_AUD;
  if(!owner||!audience||audience==='pending')return null;
  try {
    if(ctx.access){
      if(ctx.access.aud!==audience)return null;
      const identity=await ctx.access.getIdentity();
      return identity?.email?.toLowerCase()===owner?{email:owner}:null;
    }
    const issuer=env.ACCESS_ISSUER;
    if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer||''))return null;
    const token=request.headers.get('Cf-Access-Jwt-Assertion');
    if(!token||token.length>8192)return null;
    const parts=token.split('.');if(parts.length!==3)return null;
    const header=JSON.parse(decoder.decode(decode(parts[0]))),claims=JSON.parse(decoder.decode(decode(parts[1])));
    if(header.alg!=='RS256'||typeof header.kid!=='string'||claims.iss!==issuer||!Array.isArray(claims.aud)||!claims.aud.includes(audience)||claims.email?.toLowerCase()!==owner||!Number.isFinite(claims.exp)||claims.exp<=now/1000||!Number.isFinite(claims.iat)||claims.iat>now/1000+60)return null;
    let cached=keyCache.get(issuer);
    if(!cached||cached.until<now){
      const response=await transport(issuer+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(5000)});
      if(!response.ok)return null;
      const text=await response.text();if(text.length>65536)return null;
      const keys=JSON.parse(text).keys;if(!Array.isArray(keys)||keys.length>20)return null;
      cached={keys,until:now+300000};keyCache.set(issuer,cached);
    }
    const jwk=cached.keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return null;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const verified=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
    return verified?{email:owner}:null;
  }catch{return null;}
}
