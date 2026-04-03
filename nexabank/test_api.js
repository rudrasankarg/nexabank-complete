import http from 'http';

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000/api/v1/admin${path}`, {
      headers: { /* I don't have the token, so this will fail without it... */ }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

// Just printing something for now to check running state
console.log('We need token to test admin endpoints...');
