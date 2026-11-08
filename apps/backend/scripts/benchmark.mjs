import autocannon from "autocannon";

let requestId = 0;

const result = await autocannon({
  url: "http://localhost:3000/api/v1/websites",
  connections: 5,
  duration: 10,
  method: "POST",

  headers: {
    "Content-Type": "application/json"
  },

  requests: [
    {
      method: "POST",
      setupRequest: (request) => {
        const id = ++requestId;

        request.body = JSON.stringify({
          name: `Benchmark Website ${id}`,
          domain: `benchmark-${id}.example.com`,
          timezone: "Asia/Manila"
        });

        return request;
      }
    }
  ]
});

console.log("\n--- Results ---");
console.log("Requests:", result.requests.total);
console.log("Successful:", result["2xx"]);
console.log("Non-2xx:", result.non2xx);
console.log("Errors:", result.errors);
console.log("Latency:", result.latency);
