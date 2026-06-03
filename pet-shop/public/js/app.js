const state = { products: [], cart: [] };

const $ = (s) => document.querySelector(s);
const fmt = (n) => '$' + n.toFixed(2);

async function loadProducts() {
  const res = await fetch('/api/products');
  state.products = await res.json();
  renderProducts();
}

function renderProducts() {
  const grid = $('#products');
  grid.innerHTML = state.products.map(p => `
    <div class="card">
      <span class="tag">${p.category}</span>
      <div class="emoji">${p.emoji}</div>
      <h3>${p.name}</h3>
      <p class="desc">${p.desc}</p>
      <div class="price">${fmt(p.price)}</div>
      <button class="btn-add" data-add="${p.id}">Agregar 🛒</button>
    </div>
  `).join('');
}

function addToCart(id) {
  const item = state.cart.find(i => i.id === id);
  if (item) item.qty++;
  else state.cart.push({ id, qty: 1 });
  updateCartUI();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  updateCartUI();
}

function cartTotal() {
  return state.cart.reduce((s, it) => {
    const p = state.products.find(p => p.id === it.id);
    return p ? s + p.price * it.qty : s;
  }, 0);
}

function updateCartUI() {
  $('#cartCount').textContent = state.cart.reduce((s, i) => s + i.qty, 0);
  $('#cartList').innerHTML = state.cart.map(it => {
    const p = state.products.find(p => p.id === it.id);
    return `<li>
      <span>${p.emoji} ${p.name} × ${it.qty}</span>
      <span>${fmt(p.price * it.qty)} <button data-del="${it.id}">✖</button></span>
    </li>`;
  }).join('') || '<li><em>Tu carrito está vacío 🐾</em></li>';
  $('#cartTotal').textContent = fmt(cartTotal());
  $('#payTotal').textContent = fmt(cartTotal());
}

function openModal(id){ $(id).classList.remove('hidden'); }
function closeModal(el){ el.classList.add('hidden'); }

document.addEventListener('click', (e) => {
  const add = e.target.dataset.add;
  if (add) addToCart(Number(add));
  const del = e.target.dataset.del;
  if (del) removeFromCart(Number(del));
  if (e.target.dataset.close !== undefined) {
    closeModal(e.target.closest('.modal'));
  }
});

$('#cartBtn').onclick = () => { updateCartUI(); openModal('#cartModal'); };
$('#checkoutBtn').onclick = () => {
  if (state.cart.length === 0) return alert('Agrega productos primero 🐾');
  closeModal($('#cartModal'));
  openModal('#payModal');
};

// Formato suave del número de tarjeta
document.addEventListener('input', (e) => {
  if (e.target.name === 'number') {
    e.target.value = e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  }
});

$('#payForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const msg = $('#payMsg');
  const btn = $('#payBtn');
  msg.textContent = 'Procesando pago...';
  msg.className = 'msg';
  btn.disabled = true;

  try {
    const res = await fetch('/api/checkout', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        items: state.cart,
        card: {
          name: fd.get('name'),
          number: fd.get('number'),
          exp: fd.get('exp'),
          cvv: fd.get('cvv')
        },
        customer: { email: fd.get('email') }
      })
    });
    const data = await res.json();
    if (!data.ok) {
      msg.className = 'msg error';
      msg.textContent = '❌ ' + data.error;
    } else {
      closeModal($('#payModal'));
      $('#orderId').textContent = data.order.id;
      $('#orderTotal').textContent = fmt(data.order.total);
      state.cart = [];
      updateCartUI();
      e.target.reset();
      openModal('#okModal');
    }
  } catch (err) {
    msg.className = 'msg error';
    msg.textContent = '❌ Error de red.';
  } finally {
    btn.disabled = false;
  }
});

loadProducts();
