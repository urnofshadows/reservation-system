
class ReservationSystem {
    constructor() {
        this.selectedDate = null;
        this.selectedTime = null;
        this.timeSlots = [];
        this.modal = document.getElementById('modal');
        
        this.init();
    }
    
    async init() {
        this.generateTimeSlots();
        await this.generateCalendar();
        this.setupEventListeners();
        await this.loadReservations();
    }
    
    generateTimeSlots() {
        const timeSlotsContainer = document.getElementById('time-slots');
        
        for (let hour = 9; hour <= 20; hour++) {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = timeString;
            timeSlot.dataset.time = timeString;
            
            timeSlot.addEventListener('click', () => this.selectTime(timeString, timeSlot));
            timeSlotsContainer.appendChild(timeSlot);
        }
    }
    
    async generateCalendar() {
        const calendarContainer = document.getElementById('calendar');
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Clear calendar
        calendarContainer.innerHTML = '';
        
        // Add day headers
        const dayHeaders = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            calendarContainer.appendChild(header);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            calendarContainer.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const dayDate = new Date(currentYear, currentMonth, day);
            const dateString = dayDate.toISOString().split('T')[0];
            dayElement.dataset.date = dateString;
            
            // Disable past dates
            if (dayDate < today.setHours(0, 0, 0, 0)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => this.selectDate(dateString, dayElement));
            }
            
            calendarContainer.appendChild(dayElement);
        }
    }
    
    async loadReservations() {
        try {
            const response = await fetch('/api/reservations');
            const data = await response.json();
            this.existingReservations = data.reservations || [];
            
            // Update time slots when date is selected
            if (this.selectedDate) {
                this.updateTimeSlots();
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
            this.existingReservations = [];
        }
    }

    selectDate(dateString, element) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Select new date
        element.classList.add('selected');
        this.selectedDate = dateString;
        
        this.updateSelection();
        this.updateTimeSlots();
    }
    
    selectTime(timeString, element) {
        // Don't allow selection of disabled slots
        if (element.classList.contains('disabled')) {
            return;
        }
        
        // Remove previous selection
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Select new time
        element.classList.add('selected');
        this.selectedTime = timeString;
        
        this.updateSelection();
    }
    
    updateSelection() {
        const selectedDateSpan = document.getElementById('selected-date');
        const selectedTimeSpan = document.getElementById('selected-time');
        const reserveBtn = document.getElementById('reserve-btn');
        
        selectedDateSpan.textContent = this.selectedDate ? new Date(this.selectedDate).toLocaleDateString('tr-TR') : 'Yok';
        selectedTimeSpan.textContent = this.selectedTime || 'Yok';
        
        // Enable reserve button only if both date and time are selected
        reserveBtn.disabled = !(this.selectedDate && this.selectedTime);
    }
    
    setupEventListeners() {
        const reserveBtn = document.getElementById('reserve-btn');
        const modal = this.modal;
        const closeBtn = document.querySelector('.close');
        const confirmBtn = document.getElementById('confirm-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        const userCodeInput = document.getElementById('user-code');
        
        // Admin login elements
        const adminBtn = document.getElementById('admin-btn');
        const adminModal = document.getElementById('admin-modal');
        const adminCloseBtn = document.getElementById('admin-close');
        const adminLoginBtn = document.getElementById('admin-login-btn');
        const adminCancelBtn = document.getElementById('admin-cancel-btn');
        const adminUsernameInput = document.getElementById('admin-username');
        const adminPasswordInput = document.getElementById('admin-password');
        
        reserveBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            userCodeInput.value = '';
            document.getElementById('message').textContent = '';
            userCodeInput.focus();
        });
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        confirmBtn.addEventListener('click', () => {
            this.validateUserCode();
        });
        
        userCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateUserCode();
            }
            
            // Allow letters, numbers, and dots
            if (!/[a-zA-Z0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Admin modal event listeners
        adminBtn.addEventListener('click', () => {
            adminModal.style.display = 'block';
            adminUsernameInput.value = '';
            adminPasswordInput.value = '';
            document.getElementById('admin-message').textContent = '';
            adminUsernameInput.focus();
        });
        
        adminCloseBtn.addEventListener('click', () => {
            adminModal.style.display = 'none';
        });
        
        adminCancelBtn.addEventListener('click', () => {
            adminModal.style.display = 'none';
        });
        
        adminLoginBtn.addEventListener('click', () => {
            this.validateAdminLogin();
        });
        
        adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateAdminLogin();
            }
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
            if (e.target === adminModal) {
                adminModal.style.display = 'none';
            }
        });
    }
    
    async validateUserCode() {
        const userCode = document.getElementById('user-code').value.trim();
        const messageDiv = document.getElementById('message');
        
        if (userCode.length === 0 || userCode.length > 12) {
            this.showMessage('Lütfen 1-12 karakter arası bir kod giriniz.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/validate-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userCode })
            });
            
            const result = await response.json();
            
            if (result.valid) {
                this.showMessage(result.message, 'success');
                this.saveReservation(userCode);
                
                // Close modal after 2 seconds and reload reservations
                setTimeout(async () => {
                    this.modal.style.display = 'none';
                    this.resetSelection();
                    await this.loadReservations();
                }, 2000);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
        }
    }
    
    showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = type;
    }
    
    async saveReservation(userCode) {
        const reservation = {
            date: this.selectedDate,
            time: this.selectedTime,
            userCode: userCode,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Save to server
            await fetch('/api/save-reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reservation })
            });
            
            // Also save to localStorage for backward compatibility
            const existingReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            existingReservations.push(reservation);
            localStorage.setItem('reservations', JSON.stringify(existingReservations));
            
            console.log('Reservation saved:', reservation);
        } catch (error) {
            console.error('Error saving reservation to server:', error);
            // Still save to localStorage if server fails
            const existingReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            existingReservations.push(reservation);
            localStorage.setItem('reservations', JSON.stringify(existingReservations));
        }
    }
    
    validateAdminLogin() {
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value.trim();
        const messageDiv = document.getElementById('admin-message');
        
        if (username === 'ali' && password === 'bahadir') {
            this.showAdminMessage('Giriş başarılı! Yönlendiriliyor...', 'success');
            setTimeout(() => {
                window.location.href = '/admin';
            }, 1500);
        } else {
            this.showAdminMessage('Kullanıcı adı veya şifre hatalı.', 'error');
        }
    }
    
    showAdminMessage(message, type) {
        const messageDiv = document.getElementById('admin-message');
        messageDiv.textContent = message;
        messageDiv.className = type;
    }
    
    updateTimeSlots() {
        if (!this.selectedDate || !this.existingReservations) return;
        
        // Find reservations for selected date
        const dateReservations = this.existingReservations.filter(
            reservation => reservation.date === this.selectedDate
        );
        
        // Update time slots
        document.querySelectorAll('.time-slot').forEach(slot => {
            const time = slot.dataset.time;
            const isReserved = dateReservations.some(reservation => reservation.time === time);
            
            if (isReserved) {
                slot.classList.add('disabled');
                slot.style.pointerEvents = 'none';
                slot.style.opacity = '0.5';
                slot.title = 'Bu saat dolu';
            } else {
                slot.classList.remove('disabled');
                slot.style.pointerEvents = 'auto';
                slot.style.opacity = '1';
                slot.title = '';
            }
        });
    }

    resetSelection() {
        // Clear selections
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        this.selectedDate = null;
        this.selectedTime = null;
        this.updateSelection();
        
        // Reset all time slots
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('disabled');
            slot.style.pointerEvents = 'auto';
            slot.style.opacity = '1';
            slot.title = '';
        });
    }
}

// Initialize the reservation system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReservationSystem();
});
