class UIManager {
  constructor() {
    this.preQty = {};
  }

  tagHTML(tags) {
    return tags.map(t => {
      if (t === 'popular') return `<span class="tag tag-p">★ Popular</span>`;
      if (t === 'vegan')   return `<span class="tag tag-v">🌿 Veg</span>`;
      if (t === 'new')     return `<span class="tag tag-n">✦ New</span>`;
      return '';
    }).join('');
  }

  renderMenu(menuCatalog) {
    ['breakfast','allday','mains','sweets'].forEach(sec => {
      const grid = document.getElementById('grid-' + sec);
      if (!grid) return;
      grid.innerHTML = menuCatalog.getSection(sec).map(item => this.createFoodCard(item)).join('');
    });
    const drinksGrid = document.getElementById('grid-drinks');
    if (drinksGrid) {
      drinksGrid.innerHTML = menuCatalog.getSection('drinks').map(drink => this.createDrinkCard(drink)).join('');
    }
  }

  createFoodCard(item) {
    return `
      <div class="menu-card" data-id="${item.id}" data-tags="${item.tags.join(' ')}">
        <div class="card-top">
          <p class="item-name">${item.name}</p>
          <p class="item-price">₱${item.price}</p>
        </div>
        <p class="item-desc">${item.desc}</p>
        <div class="card-bottom">
          <div class="tags">${this.tagHTML(item.tags)}</div>
          <div class="add-wrap">
            <div class="qty-ctrl visible" id="qc-${item.id}">
              <button class="qty-btn" onclick="app.changePreQty('${item.id}', -1)">−</button>
              <span class="qty-num" id="qn-${item.id}">1</span>
              <button class="qty-btn" onclick="app.changePreQty('${item.id}', 1)">+</button>
            </div>
            <button class="add-btn" onclick="app.addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})">+ Add</button>
          </div>
        </div>
      </div>
    `;
  }

  createDrinkCard(drink) {
    return `
      <div class="drink-card">
        <div class="drink-icon">${drink.icon}</div>
        <p class="drink-name">${drink.name}</p>
        <p class="drink-desc">${drink.desc}</p>
        <p class="drink-price">₱${drink.price}</p>
        <div class="drink-sugar">
          <label>Sugar</label>
          <select id="sugar-${drink.id}" class="sugar-select">
            <option value="Regular">Regular</option>
            <option value="50%">50%</option>
            <option value="No sugar">No sugar</option>
          </select>
        </div>
        <div class="drink-add">
          <button class="add-btn" onclick="app.addDrinkToCart('${drink.id}', '${drink.name.replace(/'/g, "\\'")}', ${drink.price})">+ Add</button>
        </div>
      </div>
    `;
  }

  updateCart(cart, queuePos, queueLen, selectedTableId, availableCount, orderType, activeWaitTime) {
    const stats = cart.getTotals();
    const items = cart.getItems();
    const ids   = Object.keys(items);

    // Badge
    document.getElementById('cart-badge').textContent = stats.totalItems;
    document.getElementById('cart-badge').classList.toggle('show', stats.totalItems > 0);

    // Queue nav info
    const queueEl = document.getElementById('queue-info');
    if (queuePos) {
      queueEl.textContent = activeWaitTime
        ? `#${queuePos} in queue · est. ${activeWaitTime} min`
        : `#${queuePos} in queue`;
    } else if (queueLen > 0) {
      queueEl.textContent = `(${queueLen} in queue)`;
    } else {
      queueEl.textContent = '';
    }

    // Cart items
    const container = document.getElementById('cart-items');
    if (ids.length === 0) {
      container.innerHTML = `<div class="empty-cart"><div class="empty-icon">🛒</div><p>Your order is empty.<br>Add something delicious!</p></div>`;
    } else {
      container.innerHTML = ids.map(id => `
        <div class="cart-item">
          <div class="cart-item-info">
            <p class="cart-item-name">${items[id].name}</p>
            <p class="cart-item-price">₱${(items[id].price * items[id].qty).toLocaleString()}</p>
          </div>
          <div class="cart-item-qty">
            <button class="ciq-btn" onclick="app.updateCartQty('${id}', -1)">−</button>
            <span class="ciq-num">${items[id].qty}</span>
            <button class="ciq-btn" onclick="app.updateCartQty('${id}', 1)">+</button>
          </div>
        </div>
      `).join('');
    }

    // Totals
    document.getElementById('subtotal-val').textContent = `₱${stats.subtotal.toLocaleString()}`;
    document.getElementById('tax-val').textContent      = `₱${stats.tax.toLocaleString()}`;
    document.getElementById('total-val').textContent    = `₱${stats.total.toLocaleString()}`;
    document.getElementById('estimate-val').textContent = `${stats.estimatedTime} min`;

    // ── ORDER TYPE SELECTOR + SEAT UI ──
    const seatUI = document.getElementById('seat-selection-ui');
    if (seatUI) {
      const isDineIn  = orderType === 'dine-in';
      const isPickup  = orderType === 'pickup';

      // If all seats occupied, force pickup notice
      if (availableCount === 0 && !isPickup) {
        seatUI.innerHTML = `
          <div class="order-type-notice">
            <p>⚠️ All seats are currently occupied.</p>
            <button class="order-type-btn order-type-btn--active" onclick="app.setOrderType('pickup')">
              🛍️ Order for Pickup instead
            </button>
          </div>`;
      } else {
        // Build the two toggle buttons
        const dineLabel = isDineIn && selectedTableId
          ? `🪑 Table ${selectedTableId} — Change?`
          : `🪑 Dine In`;
        const pickupLabel = isPickup ? `✓ Store Pickup Selected` : `🛍️ Store Pickup`;

        seatUI.innerHTML = `
          <div class="order-type-toggle">
            <button class="order-type-btn ${isDineIn ? 'order-type-btn--active' : ''}"
                    onclick="app.setOrderType('dine-in')">
              ${dineLabel}
            </button>
            <button class="order-type-btn ${isPickup ? 'order-type-btn--active order-type-btn--pickup' : ''}"
                    onclick="app.setOrderType('pickup')">
              ${pickupLabel}
            </button>
          </div>
          ${isDineIn && !selectedTableId ? `<p class="seat-hint">👆 Select a table from the floor plan</p>` : ''}
        `;
      }
    }

    // Checkout button — disabled if no selection or empty cart
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = (ids.length === 0 || !selectedTableId);
    }
  }

  renderSeating(seatingManager, selectedTableId) {
    const container = document.getElementById('floor-plan');
    if (!container) return;

    const tables      = seatingManager.getTables();
    const smallTables = tables.filter(t => t.type === 'small');
    const largeTables = tables.filter(t => t.type === 'large');
    const barTables   = tables.filter(t => t.type === 'bar');

    const createTableHTML = (t) => {
      let statusClass = 'available';
      if (t.isOccupied)          statusClass = 'occupied';
      else if (t.id === selectedTableId) statusClass = 'selected';
      return `
        <div class="table-node table-${t.type} ${statusClass}"
             onclick="app.selectTable('${t.id}')">
          <span>${t.id}</span>
          ${t.isOccupied ? `<span class="time-stamp">${t.getOccupiedTimeString()}</span>` : ''}
        </div>`;
    };

    container.innerHTML = `
      <div class="fp-column" style="margin-top:40px">${smallTables.map(createTableHTML).join('')}</div>
      <div class="fp-column">
        <div style="background:#1d5f7b;color:white;text-align:center;padding:10px;border-radius:5px;font-size:12px;margin-bottom:20px;">Cashier – Order Pick Up</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">${largeTables.map(createTableHTML).join('')}</div>
      </div>
      <div class="fp-column" style="align-items:center">${barTables.map(createTableHTML).join('')}</div>`;

    const seatCountBtn = document.getElementById('seat-count-btn');
    if (seatCountBtn) seatCountBtn.textContent = `${seatingManager.getAvailableCount()} Seats Available`;
  }

  toggleCart(forceState) {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('overlay');
    if (drawer)  drawer.classList.toggle('open', forceState);
    if (overlay) overlay.classList.toggle('open', forceState);
  }

  toggleSeatingModal(forceState) {
    const modal   = document.getElementById('seating-modal');
    const overlay = document.getElementById('overlay');
    if (modal)   modal.classList.toggle('open', forceState);
    if (overlay) overlay.classList.toggle('open', forceState);
  }

  showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  // ── ORDER CONFIRMATION MODAL ──
  showOrderConfirmation(summary) {
    const modal = document.getElementById('order-confirm-modal');
    if (!modal) return;
    const locationLine = summary.type === 'pickup'
      ? '🛍️ Pickup at counter'
      : `🪑 Table ${summary.table}`;
    document.getElementById('oc-queue').textContent  = `#${summary.position}`;
    document.getElementById('oc-location').textContent = locationLine;
    document.getElementById('oc-total').textContent  = `₱${summary.total.toLocaleString()}`;
    modal.classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }

  hideOrderConfirmation() {
    const modal = document.getElementById('order-confirm-modal');
    if (modal) modal.classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  // ── QUEUE BANNER (live countdown) ──
  updateQueueBanner(position, mins, secs, type, table) {
    let banner = document.getElementById('queue-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'queue-banner';
      banner.className = 'queue-banner';
      document.body.appendChild(banner);
    }
    const pad = n => String(n).padStart(2, '0');
    const loc = type === 'pickup' ? 'Pickup at counter' : `Table ${table}`;
    banner.innerHTML = `
      <div class="qb-inner">
        <span class="qb-badge">#${position}</span>
        <div class="qb-info">
          <span class="qb-label">Your order · ${loc}</span>
          <span class="qb-timer">${pad(mins)}<em>:</em>${pad(secs)}<span class="qb-unit"> remaining</span></span>
        </div>
        <button class="qb-close" onclick="app.ui.hideQueueBanner()">✕</button>
      </div>`;
    banner.classList.add('visible');
  }

  hideQueueBanner() {
    const banner = document.getElementById('queue-banner');
    if (banner) banner.classList.remove('visible');
  }
}
