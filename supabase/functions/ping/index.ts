Deno.serve(() => {
  const data = {
    message: 'GitHub Actions + Deno Deploy Success!',
  };

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
});
