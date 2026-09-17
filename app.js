const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'prod-' + Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname))
});
const upload = multer({ storage });

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const SEED_PRODUCTS = [
  { id: 101, name: "NVMe Edge Server Node", category: "Compute", price: 74999, stock: 12, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80", desc: "16-core ARM CPU, 64GB ECC RAM, dual 2.5G NICs." },
  { id: 102, name: "Neural Processing Unit v4", category: "Compute", price: 145000, stock: 4, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80", desc: "Next-gen AI inference accelerator delivering 250 TFLOPs." },
  { id: 103, name: "100GbE Top-of-Rack Switch", category: "Network", price: 215000, stock: 2, image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80", desc: "32-port 100 Gigabit Ethernet switch with ultra-low latency." },
  { id: 104, name: "32TB Enterprise U.2 NVMe SSD", category: "Storage", price: 85000, stock: 0, image: "https://images.unsplash.com/photo-1628527304948-06157ee3c8a6?w=600&auto=format&fit=crop&q=80", desc: "PCIe Gen 4.0 data center solid state drive." },
  { id: 105, name: "Hardware Security Module (HSM)", category: "Security", price: 195000, stock: 5, image: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=600&auto=format&fit=crop&q=80", desc: "FIPS 140-2 Level 3 certified appliance for secure keys." },
  { id: 106, name: "64-Core Threadripper", category: "Compute", price: 380000, stock: 3, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80", desc: "Uncompromising compute power with 256MB L3 Cache." },
  { id: 107, name: "Edge Router SD-WAN Gateway", category: "Network", price: 45000, stock: 15, image: "https://images.unsplash.com/photo-1506399558188-acca6f8cbf41?w=600&auto=format&fit=crop&q=80", desc: "Cloud-managed secure branch routing." },
  { id: 108, name: "4U High-Density Storage JBOD", category: "Storage", price: 120000, stock: 1, image: "https://images.unsplash.com/photo-1524439188326-e47322d1cef2?w=600&auto=format&fit=crop&q=80", desc: "Scalable 60-bay storage chassis." },
  { id: 109, name: "Zero-Trust Biometric Key", category: "Security", price: 6500, stock: 45, image: "https://images.unsplash.com/photo-1642425149599-ca1128c66e2c?w=600&auto=format&fit=crop&q=80", desc: "FIDO2 compliant hardware authenticator." },
  { id: 110, name: "SFP28 25G Fiber Transceiver", category: "Network", price: 12500, stock: 30, image: "https://images.unsplash.com/photo-1541884848529-6887eb215b28?w=600&auto=format&fit=crop&q=80", desc: "Hot-swappable 25-Gigabit Ethernet optical transceiver." },
  { id: 111, name: "Liquid Immersion Cooling Rig", category: "Compute", price: 540000, stock: 2, image: "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=600&auto=format&fit=crop&q=80", desc: "Two-phase immersion cooling tank for high-density overclocked GPU clusters." },
  { id: 112, name: "Enterprise Tensor GPU Core", category: "Compute", price: 890000, stock: 8, image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80", desc: "80GB HBM3 memory architecture built for Large Language Model training." },
  { id: 113, name: "Quantum Key Distributor (QKD)", category: "Security", price: 1200000, stock: 1, image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80", desc: "Uses quantum mechanics to guarantee physically unbreakable encryption keys." },
  { id: 114, name: "Cold Storage Tape Library", category: "Storage", price: 175000, stock: 5, image: "https://images.unsplash.com/photo-1606149059549-6042addafc52?w=600&auto=format&fit=crop&q=80", desc: "Automated robotic LTO-9 tape library for petabyte-scale air-gapped backups." },
  { id: 115, name: "Faraday EMP Shield Rack", category: "Security", price: 85000, stock: 14, image: "https://images.unsplash.com/photo-1614064641913-6b714b6bb320?w=600&auto=format&fit=crop&q=80", desc: "Military-grade electromagnetic pulse shielding enclosure for critical servers." },
  { id: 116, name: "800G OSFP Fiber Transceiver", category: "Network", price: 42000, stock: 22, image: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=600&auto=format&fit=crop&q=80", desc: "Next-generation 800-Gigabit optics for spine-and-leaf datacenter topologies." }
];

function getProducts() {
  try { if (fs.existsSync(PRODUCTS_FILE)) return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')); } catch (e) {}
  saveJSON(PRODUCTS_FILE, SEED_PRODUCTS); return SEED_PRODUCTS;
}
function saveJSON(file, data) { try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); } catch (e) {} }
function getOrders() { try { if (fs.existsSync(ORDERS_FILE)) return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch (e) {} return []; }

app.get('/api/products', (req, res) => res.json(getProducts()));
app.post('/api/products', upload.single('imageFile'), (req, res) => {
  const { name, category, price, desc, imageUrl, stock } = req.body;
  let finalImage = req.file ? '/uploads/' + req.file.filename : (imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80");
  const currentProducts = getProducts();
  const newProduct = { id: Date.now(), name, category: category || "Compute", price: Number(price), stock: Number(stock || 10), image: finalImage, desc: desc || "Hardware." };
  currentProducts.push(newProduct); saveJSON(PRODUCTS_FILE, currentProducts);
  res.status(201).json({ message: "Listed", product: newProduct });
});

app.put('/api/products/:id', upload.single('imageFile'), (req, res) => {
  const currentProducts = getProducts(); const idx = currentProducts.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  let finalImage = currentProducts[idx].image;
  if (req.file) finalImage = '/uploads/' + req.file.filename; else if (req.body.imageUrl) finalImage = req.body.imageUrl;
  currentProducts[idx] = { ...currentProducts[idx], name: req.body.name || currentProducts[idx].name, category: req.body.category || currentProducts[idx].category, price: req.body.price ? Number(req.body.price) : currentProducts[idx].price, stock: req.body.stock !== undefined ? Number(req.body.stock) : currentProducts[idx].stock, desc: req.body.desc || currentProducts[idx].desc, image: finalImage };
  saveJSON(PRODUCTS_FILE, currentProducts); res.json({ message: "Updated" });
});

app.delete('/api/products/:id', (req, res) => {
  let currentProducts = getProducts(); currentProducts = currentProducts.filter(p => p.id !== Number(req.params.id));
  saveJSON(PRODUCTS_FILE, currentProducts); res.json({ message: "Deleted" });
});

app.get('/api/orders', (req, res) => res.json(getOrders()));
app.get('/api/orders/:id', (req, res) => {
  const found = getOrders().find(o => String(o.id).toLowerCase() === String(req.params.id).toLowerCase());
  found ? res.json(found) : res.status(404).json({ error: "Order not found" });
});

app.post('/api/checkout', (req, res) => {
  const { items, buyerName, buyerEmail, buyerAddress, paymentMethod, promoCode } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: "Cart is empty" });
  let products = getProducts(); let subtotal = 0;

  items.forEach(cartItem => {
    const p = products.find(prod => prod.id === cartItem.id);
    if (p) { p.stock = Math.max(0, (p.stock || 0) - cartItem.qty); subtotal += p.price * cartItem.qty; }
  });
  saveJSON(PRODUCTS_FILE, products);

  let discount = 0;
  if (promoCode === 'DEVOPS10') discount = subtotal * 0.10;
  const finalTotal = subtotal - discount;

  const orders = getOrders();
  const orderRecord = {
    id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
    buyer: buyerName || "Guest", email: buyerEmail || "N/A", address: buyerAddress || "Standard", paymentMethod: paymentMethod || "UPI",
    promo: promoCode || "None", discount, total: finalTotal,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
  };
  orders.unshift(orderRecord); saveJSON(ORDERS_FILE, orders);
  res.json({ message: "Order processed!", orderId: orderRecord.id });
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
