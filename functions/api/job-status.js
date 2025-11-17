export async function onRequestGet(context) {
  // TODO: Replace with your status logic
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
}

