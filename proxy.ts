import { next } from "@vercel/functions";
import { publicRedirect } from "./src/lib/publicUrl.mjs";

export const config = { runtime: "nodejs" };

// Vercel invokes this only for the public-page matchers in vercel.json.
// No environment variables, request bodies, authentication or upload code.
export default function proxy(request: Request) {
  const destination = publicRedirect(request.url, request.method);
  return destination ? new Response(null, { status: 308, headers: { Location: destination } }) : next();
}
