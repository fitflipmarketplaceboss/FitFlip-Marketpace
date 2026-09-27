const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- FRESH IN-MEMORY DATABASE ---
let fitflipStore = {
  listings: [
    { id: 1, title: 'The North Face 90s Nuptse Jacket', price: '£85.00', condition: 'Great', seller: 'luke_fitflip' },
    { id: 2, title: 'Carhartt Double-Knee Work Pants', price: '£45.00', condition: 'Good', seller: 'forest_edge' },
    { id: 3, title: 'Adidas Vintage Track Top', price: '£30.00', condition: 'Like New', seller: 'luke_fitflip' }
  ],
  haggles: [
    { id: 'haggle_1', itemTitle: 'The North Face 90s Nuptse Jacket', offerPrice: '£70.00', status: 'pending', buyer: 'alex_buyer' }
  ],
  bankAccounts: []
};

// --- API ENDPOINTS ---

// 1. Get Marketplace Feed
app.get('/api/listings', (req, res) => {
  res.json(fitflipStore.listings);
});

// 2. Post a New Listing
app.post('/api/listings', (req, res) => {
  const { title, price, condition } = req.body;
  if (!title || !price) {
    return res.status(400).json({ success: false, error: 'Title and price are required' });
  }
  const newItem = {
    id: Date.now(),
    title,
    price: price.startsWith('£') ? price : '£' + price,
    condition: condition || 'Brand New',
    seller: 'luke_fitflip'
  };
  fitflipStore.listings.unshift(newItem);
  res.json({ success: true, item: newItem });
});

// 3. Get Haggle Offers & Messages
app.get('/api/haggles', (req, res) => {
  res.json(fitflipStore.haggles);
});

// 4. Accept or Decline Haggle Offer
app.post('/api/haggles/:id/respond', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'decline'
  
  const offer = fitflipStore.haggles.find(h => h.id === id);
  if (!offer) {
    return res.status(404).json({ success: false, error: 'Offer not found' });
  }

  offer.status = action === 'accept' ? 'accepted' : 'declined';
  res.json({ success: true, status: offer.status });
});

// 5. Link Test-Mode UK Bank Account
app.post('/api/payout/setup', (req, res) => {
  const { sortCode, accountNumber } = req.body;
  if (!sortCode || !accountNumber) {
    return res.status(400).json({ success: false, error: 'Sort code and account number required' });
  }
  fitflipStore.bankAccounts.push({ sortCode, accountNumber, timestamp: new Date() });
  res.json({ success: true, message: 'UK bank account successfully linked in test mode.' });
});

// --- SINGLE-FILE FRONTEND INTERFACE ---
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FitFlip - Pre-Loved Clothing Marketplace</title>
  <style>
    :root {
      --primary: #111111;
      --bg-color: #f8f9fa;
      --card-bg: #ffffff;
      --text-main: #222222;
      --text-muted: #666666;
      --border-color: #eaeaea;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg-color); color: var(--text-main); padding-bottom: 110px; }
    
    header { background: var(--card-bg); padding: 15px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
    header h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.5px; }
    
    .container { max-width: 600px; margin: 0 auto; padding: 15px; }
    
    /* Views */
    .view { display: none; }
    .view.active { display: block; }

    /* Cards */
    .item-card { background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 15px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .item-img-placeholder { width: 100%; height: 210px; background: #e1e4e8; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-weight: 600; font-size: 0.95rem; text-align: center; padding: 0 10px; }
    .item-details { padding: 15px; }
    .item-price { font-size: 1.2rem; font-weight: 700; color: var(--primary); }
    .item-title { font-size: 1rem; margin: 5px 0; font-weight: 600; }

    /* Haggle & Messages */
    .message-bubble { background: var(--card-bg); border: 1px solid var(--border-color); padding: 14px; border-radius: 12px; margin-bottom: 12px; }
    .offer-card { background: #f1f3f5; border-left: 4px solid var(--primary); }
    .haggle-actions { display: flex; gap: 10px; margin-top: 12px; }
    .haggle-actions button { padding: 8px 14px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; }
    .btn-accept { background: #2b8a3e; color: white; }
    .btn-decline { background: #c92a2a; color: white; }
    .status-badge { font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; display: inline-block; margin-top: 5px; }
    .status-badge.accepted { background: #d4edda; color: #155724; }
    .status-badge.declined { background: #f8d7da; color: #721c24; }

    /* Forms */
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; }
    .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: #fff; }
    .btn-primary { background: var(--primary); color: white; border: none; padding: 12px; width: 100%; border-radius: 8px; font-weight: 600; cursor: pointer; }

    /* Floating Bottom Navigation Cluster */
    .bottom-nav { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(17, 17, 17, 0.95); backdrop-filter: blur(10px); display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 1000; }
    .nav-item { color: #ffffff; text-decoration: none; font-size: 0.85rem; padding: 8px 12px; border-radius: 20px; transition: background 0.2s; cursor: pointer; }
    .nav-item:hover, .nav-item.active { background: rgba(255, 255, 255, 0.15); }
    .nav-sell-btn { background: #ffffff; color: var(--primary); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: bold; text-decoration: none; box-shadow: 0 4px 10px rgba(0,0,0,0.1); cursor: pointer; }
  </style>
</head>
<body>

  <header>
    <h1>FitFlip</h1>
    <span id="header-subtitle" style="font-size: 0.8rem; color: var(--text-muted);">Marketplace Feed</span>
  </header>

  <div class="container">
    <!-- HOME VIEW -->
    <div id="view-home" class="view active">
      <h2 style="margin-bottom: 15px; font-size: 1.1rem;">Fresh Pre-Loved Drops</h2>
      <div id="feed-container"></div>
    </div>

    <!-- MESSAGES & HAGGLE VIEW -->
    <div id="view-messages" class="view">
      <h2 style="margin-bottom: 15px; font-size: 1.1rem;">Haggle Inquiries</h2>
      <div id="haggles-container"></div>
    </div>

    <!-- SELL VIEW -->
    <div id="view-sell" class="view">
      <h2 style="margin-bottom: 15px; font-size: 1.1rem;">List an Item</h2>
      <form onsubmit="handleCreateListing(event)">
        <div class="form-group">
          <label>Item Title</label>
          <input type="text" id="listing-title" placeholder="e.g. Patagonia Full-Zip Fleece" required>
        </div>
        <div class="form-group">
          <label>Price (£)</label>
          <input type="text" id="listing-price" placeholder="£35.00" required>
        </div>
        <div class="form-group">
          <label>Condition</label>
          <select id="listing-condition">
            <option value="Brand New">Brand New</option>
            <option value="Like New">Like New</option>
            <option value="Great">Great</option>
            <option value="Good">Good</option>
          </select>
        </div>
        <button type="submit" class="btn-primary">Publish Listing</button>
      </form>
    </div>

    <!-- PROFILE / PAYOUT VIEW -->
    <div id="view-profile" class="view">
      <h2 style="margin-bottom: 15px; font-size: 1.1rem;">UK Bank Payouts (Test Mode)</h2>
      <form onsubmit="handleBankPayout(event)">
        <div class="form-group">
          <label>Sort Code</label>
          <input type="text" id="sort-code" placeholder="20-04-15" required>
        </div>
        <div class="form-group">
          <label>Account Number</label>
          <input type="text" id="account-number" placeholder="12345678" required>
        </div>
        <button type="submit" class="btn-primary">Link Bank Account</button>
      </form>
      <div id="payout-feedback" style="margin-top: 15px; font-size: 0.9rem; color: #2b8a3e;"></div>
    </div>
  </div>

  <!-- Bottom Floating Navigation Cluster -->
  <nav class="bottom-nav">
    <a class="nav-item active" onclick="switchView('home', 'Marketplace Feed', this)">Home</a>
    <a class="nav-item" onclick="switchView('messages', 'Haggle Inquiries', this)">Messages</a>
    <a class="nav-sell-btn" onclick="switchView('sell', 'List an Item', this)">+</a>
    <a class="nav-item" onclick="switchView('profile', 'Payout Settings', this)">Profile</a>
  </nav>

  <script>
    function switchView(viewName, subtitle, element) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      
      document.getElementById('view-' + viewName).classList.add('active');
      document.getElementById('header-subtitle').innerText = subtitle;
      
      if (element && element.classList.contains('nav-item')) {
        element.classList.add('active');
      }
      
      if (viewName === 'home') loadListings();
      if (viewName === 'messages') loadHaggles();
    }

    async function loadListings() {
      const res = await fetch('/api/listings');
      const items = await res.json();
      document.getElementById('feed-container').innerHTML = items.map(item => \`
        <div class="item-card">
          <div class="item-img-placeholder">\${item.title}</div>
          <div class="item-details">
            <div class="item-price">\${item.price}</div>
            <div class="item-title">\${item.title}</div>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Condition: \${item.condition} • @\${item.seller}</p>
          </div>
        </div>
      \`).join('');
    }

    async function loadHaggles() {
      const res = await fetch('/api/haggles');
      const haggles = await res.json();
      document.getElementById('haggles-container').innerHTML = haggles.map(h => \`
        <div class="message-bubble offer-card">
          <p style="font-size: 0.85rem; color: var(--text-muted);">Offer from @\${h.buyer}</p>
          <p style="font-weight: 600; margin: 4px 0;">\${h.itemTitle}</p>
          <p>Haggle Offer: <span style="color: var(--primary); font-weight: 700;">\${h.offerPrice}</span></p>
          <div id="haggle-action-\${h.id}">
            \${h.status === 'pending' ? \`
              <div class="haggle-actions">
                <button class="btn-accept" onclick="respondHaggle('\${h.id}', 'accept')">Accept Offer</button>
                <button class="btn-decline" onclick="respondHaggle('\${h.id}', 'decline')">Decline</button>
              </div>
            \` : \`
              <span class="status-badge \${h.status}">Offer \${h.status.toUpperCase()}</span>
            \`}
          </div>
        </div>
      \`).join('');
    }

    async function respondHaggle(id, action) {
      const res = await fetch(\`/api/haggles/\${id}/respond\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        loadHaggles();
      }
    }

    async function handleCreateListing(e) {
      e.preventDefault();
      const title = document.getElementById('listing-title').value;
      const price = document.getElementById('listing-price').value;
      const condition = document.getElementById('listing-condition').value;

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, price, condition })
      });
      const data = await res.json();
      if (data.success) {
        alert('Listing published successfully!');
        document.getElementById('listing-title').value = '';
        document.getElementById('listing-price').value = '';
        switchView('home', 'Marketplace Feed', document.querySelectorAll('.nav-item')[0]);
      }
    }

    async function handleBankPayout(e) {
      e.preventDefault();
      const sortCode = document.getElementById('sort-code').value;
      const accountNumber = document.getElementById('account-number').value;

      const res = await fetch('/api/payout/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortCode, accountNumber })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('payout-feedback').innerText = '✓ UK bank account linked successfully in test mode.';
      }
    }

    // Initial load on page start
    loadListings();
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`FitFlip marketplace running on port ${PORT}`);
});
