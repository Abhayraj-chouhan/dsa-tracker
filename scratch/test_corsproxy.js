fetch('https://api.codetabs.com/v1/proxy?quest=https://leetcode.com/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
      }
    }`,
    variables: { username: "abhaysinh123" }
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
