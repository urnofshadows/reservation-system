
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// API endpoint to get reservations for calendar
app.get('/api/reservations', (req, res) => {
  try {
    let reservations = [];
    if (fs.existsSync('reservations.json')) {
      const reservationsData = fs.readFileSync('reservations.json', 'utf8');
      reservations = JSON.parse(reservationsData);
    }
    res.json({ reservations });
  } catch (error) {
    res.status(500).json({ reservations: [] });
  }
});

// API endpoint to validate user code
app.post('/api/validate-code', (req, res) => {
  const { userCode } = req.body;
  
  try {
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);
    
    if (users.validCodes.includes(userCode)) {
      res.json({ valid: true, message: 'Rezervasyon onaylandı!' });
    } else {
      res.json({ valid: false, message: 'Geçersiz kullanıcı kodu. Lütfen tekrar deneyin.' });
    }
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Sunucu hatası. Lütfen tekrar deneyin.' });
  }
});

// Admin API endpoints

// Get all reservations (from localStorage simulation)
app.get('/api/admin/reservations', (req, res) => {
  try {
    // Since we're using localStorage on frontend, we'll create a reservations.json file
    let reservations = [];
    if (fs.existsSync('reservations.json')) {
      const reservationsData = fs.readFileSync('reservations.json', 'utf8');
      reservations = JSON.parse(reservationsData);
    }
    res.json({ reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rezervasyonlar yüklenemedi.' });
  }
});

// Save a reservation (called when user makes a reservation)
app.post('/api/save-reservation', (req, res) => {
  try {
    const { reservation } = req.body;
    
    let reservations = [];
    if (fs.existsSync('reservations.json')) {
      const reservationsData = fs.readFileSync('reservations.json', 'utf8');
      reservations = JSON.parse(reservationsData);
    }
    
    reservations.push(reservation);
    fs.writeFileSync('reservations.json', JSON.stringify(reservations, null, 2));
    
    res.json({ success: true, message: 'Rezervasyon kaydedildi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rezervasyon kaydedilemedi.' });
  }
});

// Update a reservation
app.put('/api/admin/reservations/update', (req, res) => {
  try {
    const { index, reservation } = req.body;
    
    if (!fs.existsSync('reservations.json')) {
      return res.json({ success: false, message: 'Rezervasyon dosyası bulunamadı.' });
    }
    
    const reservationsData = fs.readFileSync('reservations.json', 'utf8');
    const reservations = JSON.parse(reservationsData);
    
    if (index < 0 || index >= reservations.length) {
      return res.json({ success: false, message: 'Geçersiz rezervasyon indeksi.' });
    }
    
    // Validate user code exists
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);
    
    if (!users.validCodes.includes(reservation.userCode)) {
      return res.json({ success: false, message: 'Geçersiz kullanıcı kodu.' });
    }
    
    reservations[index] = reservation;
    fs.writeFileSync('reservations.json', JSON.stringify(reservations, null, 2));
    
    res.json({ success: true, message: 'Rezervasyon güncellendi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rezervasyon güncellenemedi.' });
  }
});

// Delete a reservation
app.delete('/api/admin/reservations/delete', (req, res) => {
  try {
    const { index } = req.body;
    
    if (!fs.existsSync('reservations.json')) {
      return res.json({ success: false, message: 'Rezervasyon dosyası bulunamadı.' });
    }
    
    const reservationsData = fs.readFileSync('reservations.json', 'utf8');
    const reservations = JSON.parse(reservationsData);
    
    if (index < 0 || index >= reservations.length) {
      return res.json({ success: false, message: 'Geçersiz rezervasyon indeksi.' });
    }
    
    reservations.splice(index, 1);
    fs.writeFileSync('reservations.json', JSON.stringify(reservations, null, 2));
    
    res.json({ success: true, message: 'Rezervasyon silindi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rezervasyon silinemedi.' });
  }
});

// Get all users
app.get('/api/admin/users', (req, res) => {
  try {
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Kullanıcı kodları yüklenemedi.' });
  }
});

// Add a new user code
app.post('/api/admin/users/add', (req, res) => {
  try {
    const { userCode } = req.body;
    
    if (!userCode || userCode.length === 0 || userCode.length > 12) {
      return res.json({ success: false, message: 'Kullanıcı kodu 1-12 karakter arası olmalıdır.' });
    }
    
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);
    
    if (users.validCodes.includes(userCode)) {
      return res.json({ success: false, message: 'Bu kullanıcı kodu zaten mevcut.' });
    }
    
    users.validCodes.push(userCode);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    
    res.json({ success: true, message: 'Kullanıcı kodu eklendi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Kullanıcı kodu eklenemedi.' });
  }
});

// Delete a user code
app.delete('/api/admin/users/delete', (req, res) => {
  try {
    const { index } = req.body;
    
    const usersData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(usersData);
    
    if (index < 0 || index >= users.validCodes.length) {
      return res.json({ success: false, message: 'Geçersiz kullanıcı indeksi.' });
    }
    
    users.validCodes.splice(index, 1);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    
    res.json({ success: true, message: 'Kullanıcı kodu silindi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Kullanıcı kodu silinemedi.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
