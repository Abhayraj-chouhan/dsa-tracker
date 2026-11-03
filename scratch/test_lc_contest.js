async function testLC() {
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query userContestRankingInfo($username: String!) {
          userContestRankingHistory(username: $username) {
            contest { title startTime }
            rating
          }
        }`,
        variables: { username: "lee215" }
      })
    });
    const data = await res.json();
    console.log("History length:", data.data.userContestRankingHistory?.length);
    if(data.data.userContestRankingHistory?.length > 0) {
      console.log("Sample:", data.data.userContestRankingHistory[0]);
    }
  } catch(e) {
    console.error(e);
  }
}
testLC();
