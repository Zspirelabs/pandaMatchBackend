// Deno.serve(() => {
//   const data = {
//     message: 'GitHub Actions + Deno Deploy Success!',
//   };

//   return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
// });


Deno.serve(() => {
  // JavaScript code: Simple addition
  const num1 = 10;
  const num2 = 20;
  const sum = num1 + num2;

  const data = {
    message: 'GitHub Actions + Deno Deploy Success!',
    sum: sum, // Include the result of the addition in the response
  };

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
});
