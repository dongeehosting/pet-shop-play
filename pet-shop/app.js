const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- DATOS MOCK ----------
const products = [
  { id: 1, name: 'Croquetas Premium para Perro', price: 25.99, emoji: '🐶', category: 'Comida', desc: 'Alimento balanceado sabor pollo, 3kg.' },
  { id: 2, name: 'Arena Aglomerante para Gato', price: 12.50, emoji: '🐱', category: 'Higiene', desc: 'Control de olores extra, 5kg.' },
  { id: 3, name: 'Pelota de Goma Mordedora', price: 6.75, emoji: '🎾', category: 'Juguetes', desc: 'Resistente, ideal para juegos al aire libre.' },
  { id: 4, name: 'Casita para Hámster', price: 18.00, emoji: '🐹', category: 'Hogar', desc: 'Con rueda, tobogán y bebedero.' },
  { id: 5, name: 'Alimento para Peces Tropicales', price: 8.20, emoji: '🐠', category: 'Comida', desc: 'Escamas nutritivas, 250g.' },
  { id: 6, name: 'Collar LED para Perro', price: 14.90, emoji: '💡', category: 'Accesorios', desc: 'Recargable, visible de noche.' },
  { id: 7, name: 'Rascador para Gato', price: 32.40, emoji: '🪵', category: 'Juguetes', desc: 'Torre de 80cm con cuerda de sisal.' },
  { id: 8, name: 'Jaula para Periquito', price: 45.00, emoji: '🦜', category: 'Hogar', desc: 'Espaciosa con comedero y columpio.' },
  { id: 9, name: 'Shampoo Hipoalergénico', price: 9.99, emoji: '🛁', category: 'Higiene', desc: 'Para piel sensible, 500ml.' }
];

const orders = new Map();

// ---------- API ----------
app.get('/api/products', (req, res) => res.json(products));

// Pasarela de pago simulada
app.post('/api/checkout', (req, res) => {
  const { items, card, customer } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'El carrito está vacío.' });
  }
  if (!card || !card.number || !card.name || !card.exp || !card.cvv) {
    return res.status(400).json({ ok: false, error: 'Datos de tarjeta incompletos.' });
  }
  const digits = String(card.number).replace(/\s+/g, '');
  if (!/^\d{16}$/.test(digits)) {
    return res.status(400).json({ ok: false, error: 'El número de tarjeta debe tener 16 dígitos.' });
  }
  if (!/^\d{3,4}$/.test(card.cvv)) {
    return res.status(400).json({ ok: false, error: 'CVV inválido.' });
  }

  // Simulación: tarjetas terminadas en 0000 fallan (para probar el flujo)
  if (digits.endsWith('0000')) {
    return res.status(402).json({ ok: false, error: 'Pago rechazado por el banco emisor (simulado).' });
  }

  const total = items.reduce((s, it) => {
    const p = products.find(p => p.id === it.id);
    return p ? s + p.price * it.qty : s;
  }, 0);

  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    items,
    total: Number(total.toFixed(2)),
    customer: customer || null,
    cardLast4: digits.slice(-4),
    status: 'PAGADO'
  };
  orders.set(orderId, order);

  // Simular latencia de pasarela
  setTimeout(() => res.json({ ok: true, order }), 800);
});

app.get('/api/orders/:id', (req, res) => {
  const o = orders.get(req.params.id);
  if (!o) return res.status(404).json({ ok: false, error: 'Orden no encontrada' });
  res.json({ ok: true, order: o });
});

// ---------- ARRANQUE ----------
function start() {
  const server = app.listen(() => {
    const { port } = server.address();
    console.log(`🐾 PetShop corriendo en http://localhost:${port}`);
  });
  return server;
}

module.exports = { start, app };

// Permite ejecutar directamente: `node app.js`
if (require.main === module) start();

