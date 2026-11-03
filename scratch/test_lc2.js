fetch('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'query { recentAcSubmissionList(username: "striver_79", limit: 200) { titleSlug } }'
  })
})
  .then(r => r.json())
  .then(data => console.log(data.data.recentAcSubmissionList.length))
  .catch(console.error);
