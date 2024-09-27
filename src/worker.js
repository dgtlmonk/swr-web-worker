
// worker.js
self.onmessage = async function () {
  // Simulate fetching new data from a server
  const freshData = await fetchFreshData();
  postMessage(freshData);
};

async function fetchFreshData() {
  // Simulate an API request for fresh data
  const response = await fetch("https://reqres.in/api/users?page=2");
  const qry = await response.json();
  return qry.data;
}
