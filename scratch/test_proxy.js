const query = `{
  matchedUser(username: "neal_wu") {
    submitStatsGlobal {
      acSubmissionNum { difficulty count }
    }
    profile { ranking }
    submissionCalendar
  }
}`;

async function test() {
  // Test 1: Direct LeetCode via Vite proxy
  try {
    const res = await fetch("http://localhost:5173/leetcode-proxy/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    console.log("Proxy status:", res.status);
    const data = await res.json();
    console.log("Proxy result:", JSON.stringify(data, null, 2).substring(0, 600));
  } catch (e) {
    console.log("Proxy FAIL:", e.message);
  }

  // Test 2: alfa-leetcode-api
  try {
    const res = await fetch("https://alfa-leetcode-api.onrender.com/neal_wu/solved");
    console.log("\nalfa-api status:", res.status);
    const data = await res.json();
    console.log("alfa-api result:", JSON.stringify(data, null, 2).substring(0, 400));
  } catch (e) {
    console.log("alfa-api FAIL:", e.message);
  }
}

test();
