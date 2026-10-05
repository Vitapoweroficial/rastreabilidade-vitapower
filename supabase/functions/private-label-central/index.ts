declare const Deno: { env: { get(name:string):string|undefined }; serve(handler:(req:Request)=>Promise<Response>):void };
const KEY_HASH = "4a2b3888879a9e5f518d91e69b4f1a9e6388d6904a87847105b6a721a11a5e92";
const base = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function db(path: string, body?: unknown) {
 const response = await fetch(base + "/rest/v1/" + path, { method: body ? "POST" : "GET", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
 const value = await response.json();
 if (!response.ok) throw Object.assign(new Error(value.message || "Database unavailable"), { status: value.code === "40001" ? 409 : 500 });
 return value;
}
async function allRows(path:string){
 const rows:unknown[]=[];for(let offset=0;;offset+=500){const batch=await db(path+"&limit=500&offset="+offset);rows.push(...batch);if(batch.length<500)return rows;}
}
Deno.serve(async req => {
 try {
  const token = req.headers.get("x-central-token") || "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const actual = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
  if (actual !== KEY_HASH) return reply({ error: "Unauthorized" },401);
  if (req.method !== "POST") return reply({ error: "Method not allowed" },405);
  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > 300000) return reply({ error: "Payload too large" },413);
  const input = JSON.parse(raw);
  if (input.action === "load") {
   const [documents, events] = await Promise.all([allRows("pl_central_documents?select=*&order=kind,id"),allRows("pl_central_events?select=*&order=created_at.desc,id")]);
   return reply({documents,events});
  }
  if (input.action !== "save" || !["project","preferences","settings"].includes(input.kind) || typeof input.id !== "string" || !/^\d+$|^global$/.test(input.id) || !Number.isSafeInteger(input.revision) || input.revision < 0 || !Number.isSafeInteger(input.actorId) || input.actorId < 1 || typeof input.actorName !== "string" || typeof input.summary !== "string" || !input.payload || Array.isArray(input.payload)) return reply({error:"Invalid request"},400);
  const result = await db("rpc/pl_central_save",{p_kind:input.kind,p_id:input.id,p_payload:input.payload,p_revision:input.revision,p_actor_id:input.actorId,p_actor_name:input.actorName,p_summary:input.summary});
  return reply({document:result});
 } catch(error) { return reply({ error: error instanceof Error ? error.message : "Request failed" },(error as {status?:number}).status || 500); }
});
