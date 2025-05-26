
class AdminDashboard {
    constructor() {
        this.currentEditIndex = null;
        this.reservations = [];
        this.users = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadReservations();
        this.loadUsers();
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Refresh reservations
        document.getElementById('refresh-reservations').addEventListener('click', () => {
            this.loadReservations();
        });
        
        // Add user button
        document.getElementById('add-user').addEventListener('click', () => {
            this.showAddUserModal();
        });
        
        // Filter events
        document.getElementById('date-filter').addEventListener('change', () => {
            this.filterReservations();
        });
        
        document.getElementById('time-filter').addEventListener('change', () => {
            this.filterReservations();
        });
        
        document.getElementById('user-filter').addEventListener('input', () => {
            this.filterReservations();
        });
        
        // Modal events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        document.getElementById('cancel-edit').addEventListener('click', () => {
            document.getElementById('edit-reservation-modal').style.display = 'none';
        });
        
        document.getElementById('cancel-add-user').addEventListener('click', () => {
            document.getElementById('add-user-modal').style.display = 'none';
        });
        
        // Form submissions
        document.getElementById('edit-reservation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReservationEdit();
        });
        
        document.getElementById('add-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewUser();
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Validate user code input (numbers only)
        document.getElementById('new-user-code').addEventListener('keypress', (e) => {
            if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.getElementById('edit-user-code').addEventListener('keypress', (e) => {
            if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }
    
    async loadReservations() {
        try {
            const response = await fetch('/api/admin/reservations');
            const data = await response.json();
            this.reservations = data.reservations || [];
            this.displayReservations(this.reservations);
        } catch (error) {
            console.error('Error loading reservations:', error);
            this.showMessage('Rezervasyonlar yüklenirken hata oluştu.', 'error');
        }
    }
    
    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            this.users = data.validCodes || [];
            this.displayUsers(this.users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showMessage('Kullanıcı kodları yüklenirken hata oluştu.', 'error');
        }
    }
    
    displayReservations(reservations) {
        const tbody = document.getElementById('reservations-tbody');
        
        if (!reservations || reservations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Henüz rezervasyon bulunmuyor.</td></tr>';
            return;
        }
        
        tbody.innerHTML = reservations.map((reservation, index) => `
            <tr>
                <td>${new Date(reservation.date).toLocaleDateString('tr-TR')}</td>
                <td>${reservation.time}</td>
                <td>${reservation.userCode}</td>
                <td>${new Date(reservation.timestamp).toLocaleString('tr-TR')}</td>
                <td>
                    <button class="btn btn-warning" onclick="adminDashboard.editReservation(${index})">Düzenle</button>
                    <button class="btn btn-danger" onclick="adminDashboard.deleteReservation(${index})">Sil</button>
                </td>
            </tr>
        `).join('');
    }
    
    displayUsers(users) {
        const tbody = document.getElementById('users-tbody');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="empty-state">Kullanıcı kodu bulunmuyor.</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map((userCode, index) => `
            <tr>
                <td>${userCode}</td>
                <td>
                    <button class="btn btn-danger" onclick="adminDashboard.deleteUser(${index})">Sil</button>
                </td>
            </tr>
        `).join('');
    }
    
    filterReservations() {
        const dateFilter = document.getElementById('date-filter').value;
        const timeFilter = document.getElementById('time-filter').value;
        const userFilter = document.getElementById('user-filter').value.toLowerCase();
        
        let filtered = this.reservations;
        
        if (dateFilter) {
            filtered = filtered.filter(r => r.date === dateFilter);
        }
        
        if (timeFilter) {
            filtered = filtered.filter(r => r.time === timeFilter);
        }
        
        if (userFilter) {
            filtered = filtered.filter(r => r.userCode.toLowerCase().includes(userFilter));
        }
        
        this.displayReservations(filtered);
    }
    
    editReservation(index) {
        this.currentEditIndex = index;
        const reservation = this.reservations[index];
        
        document.getElementById('edit-date').value = reservation.date;
        document.getElementById('edit-time').value = reservation.time;
        document.getElementById('edit-user-code').value = reservation.userCode;
        
        document.getElementById('edit-reservation-modal').style.display = 'block';
    }
    
    async saveReservationEdit() {
        const editedReservation = {
            date: document.getElementById('edit-date').value,
            time: document.getElementById('edit-time').value,
            userCode: document.getElementById('edit-user-code').value,
            timestamp: this.reservations[this.currentEditIndex].timestamp
        };
        
        if (editedReservation.userCode.length !== 12) {
            this.showMessage('Kullanıcı kodu 12 haneli olmalıdır.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/admin/reservations/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    index: this.currentEditIndex,
                    reservation: editedReservation
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Rezervasyon başarıyla güncellendi.', 'success');
                document.getElementById('edit-reservation-modal').style.display = 'none';
                this.loadReservations();
            } else {
                this.showMessage(result.message || 'Güncelleme hatası.', 'error');
            }
        } catch (error) {
            this.showMessage('Bağlantı hatası.', 'error');
        }
    }
    
    async deleteReservation(index) {
        if (!confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/admin/reservations/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ index })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Rezervasyon silindi.', 'success');
                this.loadReservations();
            } else {
                this.showMessage(result.message || 'Silme hatası.', 'error');
            }
        } catch (error) {
            this.showMessage('Bağlantı hatası.', 'error');
        }
    }
    
    showAddUserModal() {
        document.getElementById('new-user-code').value = '';
        document.getElementById('add-user-modal').style.display = 'block';
    }
    
    async addNewUser() {
        const userCode = document.getElementById('new-user-code').value.trim();
        
        if (userCode.length !== 12) {
            this.showMessage('Kullanıcı kodu 12 haneli olmalıdır.', 'error');
            return;
        }
        
        if (this.users.includes(userCode)) {
            this.showMessage('Bu kullanıcı kodu zaten mevcut.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/admin/users/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userCode })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Kullanıcı kodu eklendi.', 'success');
                document.getElementById('add-user-modal').style.display = 'none';
                this.loadUsers();
            } else {
                this.showMessage(result.message || 'Ekleme hatası.', 'error');
            }
        } catch (error) {
            this.showMessage('Bağlantı hatası.', 'error');
        }
    }
    
    async deleteUser(index) {
        if (!confirm('Bu kullanıcı kodunu silmek istediğinizden emin misiniz?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/admin/users/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ index })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Kullanıcı kodu silindi.', 'success');
                this.loadUsers();
            } else {
                this.showMessage(result.message || 'Silme hatası.', 'error');
            }
        } catch (error) {
            this.showMessage('Bağlantı hatası.', 'error');
        }
    }
    
    showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

// Initialize admin dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});
