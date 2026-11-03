async function testAPIs() {
  // LeetCode Contest
  try {
    const lcRes = await fetch('https://alfa-leetcode-api.onrender.com/striver_79/contest');
    const lcData = await lcRes.json();
    console.log("LeetCode Contest Data for striver_79:", {
      rating: lcData.contestRating,
      attend: lcData.contestAttend,
      historyLength: lcData.contestParticipation?.length
    });
  } catch (e) {
    console.error("LC Error", e);
  }

  // Codeforces
  try {
    const cfRes = await fetch('https://codeforces.com/api/user.rating?handle=tourist');
    const cfData = await cfRes.json();
    console.log("Codeforces Rating History for tourist:", {
      status: cfData.status,
      historyLength: cfData.result?.length
    });
  } catch (e) {
    console.error("CF Error", e);
  }

  // GFG
  // Does GFG have a contest API endpoint in this project's proxy?
  // Our proxy for GFG doesn't seem to fetch contest rating history natively. 
  // Let's check the GFG proxy we were using or how alfa-leetcode-api equivalent handles it.
  // We use geeksforgeeks API via web scraping in other repositories.
}
testAPIs();
