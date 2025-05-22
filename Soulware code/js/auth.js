// Управление состоянием авторизации
class Auth {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.authButton = document.getElementById('auth-button');
    this.init();
  }

  init() {
    // Проверяем состояние авторизации при загрузке
    this.checkAuth();
    
    // Добавляем обработчик для кнопки авторизации
    if (this.authButton) {
      this.authButton.addEventListener('click', () => {
        if (this.isAuthenticated) {
          this.logout();
        } else {
          this.redirectToLogin();
        }
      });
    }
  }

  checkAuth() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        this.user = JSON.parse(userData);
        this.isAuthenticated = true;
        this.updateUI();
      } catch (e) {
        console.error('Error parsing user data:', e);
        this.logout();
      }
    }
  }

  updateUI() {
    if (!this.authButton) return;

    if (this.isAuthenticated && this.user) {
      this.authButton.textContent = this.user.name || 'Профиль';
      this.authButton.classList.remove('bg-purple-600', 'hover:bg-purple-700');
      this.authButton.classList.add('text-purple-400', 'hover:text-purple-300');
    } else {
      this.authButton.textContent = 'Войти';
      this.authButton.classList.add('bg-purple-600', 'hover:bg-purple-700');
      this.authButton.classList.remove('text-purple-400', 'hover:text-purple-300');
    }
  }

  redirectToLogin() {
    window.location.href = '/login.html';
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.isAuthenticated = false;
    this.user = null;
    this.updateUI();
    
    // Если мы на защищенной странице, перенаправляем на главную
    const protectedPages = ['profile.html', 'admin.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage)) {
      window.location.href = '/';
    }
  }
}

// Инициализируем систему авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.auth = new Auth();
}); 