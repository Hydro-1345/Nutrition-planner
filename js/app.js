/**
 * Core Application JavaScript
 * Handles theme management, navigation, and shared utilities
 * for the Nutrition & Meal Planner application
 */

// ===== CONSTANTS AND CONFIGURATION =====
const APP_CONFIG = {
  version: '1.0.0',
  name: 'NutriPlan',
  storage: {
    prefix: 'nutriplan_',
    keys: {
      theme: 'theme',
      profile: 'profile',
      meals: 'meals',
      mealLibrary: 'meal_library',
      goals: 'goals'
    }
  },
  defaults: {
    theme: 'light',
    profile: {
      firstName: '',
      lastName: '',
      age: null,
      gender: '',
      height: null,
      weight: null,
      activityLevel: '',
      goal: ''
    },
    goals: {
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 200,
      fatsGoal: 80
    }
  }
};

// ===== UTILITY FUNCTIONS =====
class StorageManager {
  /**
   * Get data from localStorage with error handling
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Stored data or default value
   */
  static get(key, defaultValue = null) {
    try {
      const fullKey = APP_CONFIG.storage.prefix + key;
      const item = localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * Set data in localStorage with error handling
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  static set(key, value) {
    try {
      const fullKey = APP_CONFIG.storage.prefix + key;
      localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  static remove(key) {
    try {
      const fullKey = APP_CONFIG.storage.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all app data from localStorage
   * @returns {boolean} Success status
   */
  static clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(APP_CONFIG.storage.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
}

class DateUtils {
  /**
   * Format date to YYYY-MM-DD string
   * @param {Date} date - Date object
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get current date as formatted string
   * @returns {string} Current date in YYYY-MM-DD format
   */
  static getCurrentDate() {
    return this.formatDate(new Date());
  }

  /**
   * Get start of current week (Monday)
   * @returns {Date} Start of week date
   */
  static getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  /**
   * Get array of dates for current week
   * @returns {Array<string>} Array of date strings
   */
  static getWeekDates(startDate = null) {
    const start = startDate || this.getWeekStart();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(this.formatDate(date));
    }
    return dates;
  }

  /**
   * Get day name from date string
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {string} Day name (e.g., 'Monday')
   */
  static getDayName(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  /**
   * Get short day name from date string
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {string} Short day name (e.g., 'Mon')
   */
  static getShortDayName(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  /**
   * Format date for display
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {string} Formatted date for display
   */
  static formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

class ValidationUtils {
  /**
   * Sanitize HTML input to prevent XSS attacks
   * @param {string} input - Raw input string
   * @returns {string} Sanitized string
   */
  static sanitizeHTML(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Validate email format
   * @param {string} email - Email string
   * @returns {boolean} Valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate numeric input within range
   * @param {number} value - Numeric value
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} Valid number
   */
  static isValidNumber(value, min = 0, max = Infinity) {
    return !isNaN(value) && value >= min && value <= max;
  }

  /**
   * Validate required form fields
   * @param {Object} data - Form data object
   * @param {Array<string>} requiredFields - Array of required field names
   * @returns {Object} Validation result with isValid and errors
   */
  static validateRequired(data, requiredFields) {
    const errors = [];
    const isValid = requiredFields.every(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push(`${field} is required`);
        return false;
      }
      return true;
    });
    return { isValid, errors };
  }
}

// ===== THEME MANAGEMENT =====
class ThemeManager {
  constructor() {
    this.currentTheme = StorageManager.get(APP_CONFIG.storage.keys.theme, APP_CONFIG.defaults.theme);
    this.init();
  }

  /**
   * Initialize theme system
   */
  init() {
    this.applyTheme(this.currentTheme);
    this.setupToggleButton();
    this.setupSystemThemeListener();
  }

  /**
   * Apply theme to document
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    StorageManager.set(APP_CONFIG.storage.keys.theme, theme);
    this.updateToggleButton();
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  /**
   * Setup theme toggle button event listeners
   */
  setupToggleButton() {
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggleTheme());
    }
  }

  /**
   * Update toggle button icon based on current theme
   */
  updateToggleButton() {
    const toggleButton = document.getElementById('theme-toggle');
    const themeIcon = toggleButton?.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
  }

  /**
   * Listen for system theme changes
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener((e) => {
        // Only auto-switch if user hasn't manually set a preference
        const storedTheme = StorageManager.get(APP_CONFIG.storage.keys.theme);
        if (!storedTheme) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
}

// ===== NAVIGATION MANAGEMENT =====
class NavigationManager {
  constructor() {
    this.init();
  }

  /**
   * Initialize navigation functionality
   */
  init() {
    this.setupMobileToggle();
    this.setupActiveLink();
    this.setupKeyboardNavigation();
  }

  /**
   * Setup mobile navigation toggle
   */
  setupMobileToggle() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
        navToggle.classList.toggle('active');
      });

      // Close mobile menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove('show');
          navToggle.classList.remove('active');
        }
      });
    }
  }

  /**
   * Setup active navigation link highlighting
   */
  setupActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Setup keyboard navigation for accessibility
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // ESC key closes modals and mobile menu
      if (e.key === 'Escape') {
        this.closeAllModals();
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Close all open modals
   */
  closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('show');
    });
  }

  /**
   * Close mobile navigation menu
   */
  closeMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    if (navMenu && navToggle) {
      navMenu.classList.remove('show');
      navToggle.classList.remove('active');
    }
  }
}

// ===== NOTIFICATION SYSTEM =====
class NotificationManager {
  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {number} duration - Duration in milliseconds
   */
  static showSuccess(message, duration = 3000) {
    this.showNotification(message, 'success', duration);
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {number} duration - Duration in milliseconds
   */
  static showError(message, duration = 5000) {
    this.showNotification(message, 'error', duration);
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {number} duration - Duration in milliseconds
   */
  static showInfo(message, duration = 3000) {
    this.showNotification(message, 'info', duration);
  }

  /**
   * Show notification with specified type
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('success', 'error', 'info')
   * @param {number} duration - Duration in milliseconds
   */
  static showNotification(message, type, duration) {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${this.getIcon(type)}</span>
      <span class="notification-message">${ValidationUtils.sanitizeHTML(message)}</span>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    `;

    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '100px',
      right: '20px',
      zIndex: '9999',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      maxWidth: '400px',
      animation: 'slideInRight 0.3s ease-out',
      backgroundColor: this.getBackgroundColor(type),
      color: 'white',
      fontWeight: '500'
    });

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = 'background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: 8px;';
    closeBtn.addEventListener('click', () => notification.remove());

    // Add to DOM
    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }

  /**
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} Icon emoji
   */
  static getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  }

  /**
   * Get background color for notification type
   * @param {string} type - Notification type
   * @returns {string} CSS color value
   */
  static getBackgroundColor(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6'
    };
    return colors[type] || '#3b82f6';
  }
}

// ===== FORM UTILITIES =====
class FormUtils {
  /**
   * Get form data as object
   * @param {HTMLFormElement} form - Form element
   * @returns {Object} Form data object
   */
  static getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      // Handle numeric inputs
      const input = form.querySelector(`[name="${key}"]`);
      if (input && input.type === 'number') {
        data[key] = value ? parseFloat(value) : null;
      } else {
        data[key] = ValidationUtils.sanitizeHTML(value.trim());
      }
    }
    
    return data;
  }

  /**
   * Populate form with data
   * @param {HTMLFormElement} form - Form element
   * @param {Object} data - Data object
   */
  static populateForm(form, data) {
    Object.keys(data).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input && data[key] !== null && data[key] !== undefined) {
        input.value = data[key];
      }
    });
  }

  /**
   * Reset form to default state
   * @param {HTMLFormElement} form - Form element
   */
  static resetForm(form) {
    form.reset();
    
    // Clear any error states
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.classList.remove('show'));
    
    const invalidInputs = form.querySelectorAll('.invalid');
    invalidInputs.forEach(input => input.classList.remove('invalid'));
  }

  /**
   * Show form validation errors
   * @param {HTMLFormElement} form - Form element
   * @param {Array<string>} errors - Array of error messages
   */
  static showErrors(form, errors) {
    // Clear existing errors
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.classList.remove('show'));

    // Show new errors
    errors.forEach(error => {
      NotificationManager.showError(error);
    });
  }
}

// ===== ANIMATION UTILITIES =====
class AnimationUtils {
  /**
   * Add fade-in animation to element
   * @param {HTMLElement} element - Target element
   * @param {number} delay - Delay in milliseconds
   */
  static fadeIn(element, delay = 0) {
    setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'all 0.3s ease-out';
      
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      });
    }, delay);
  }

  /**
   * Add staggered fade-in animation to multiple elements
   * @param {NodeList} elements - Elements to animate
   * @param {number} stagger - Stagger delay in milliseconds
   */
  static staggerFadeIn(elements, stagger = 100) {
    elements.forEach((element, index) => {
      this.fadeIn(element, index * stagger);
    });
  }

  /**
   * Add loading state to element
   * @param {HTMLElement} element - Target element
   */
  static addLoadingState(element) {
    element.classList.add('loading');
    const originalContent = element.innerHTML;
    element.innerHTML = `<span class="spinner"></span> Loading...`;
    return originalContent;
  }

  /**
   * Remove loading state from element
   * @param {HTMLElement} element - Target element
   * @param {string} originalContent - Original element content
   */
  static removeLoadingState(element, originalContent) {
    element.classList.remove('loading');
    element.innerHTML = originalContent;
  }
}

// ===== CHART UTILITIES =====
class ChartUtils {
  /**
   * Get chart theme colors based on current theme
   * @returns {Object} Chart color configuration
   */
  static getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    return {
      primary: '#10b981',
      secondary: '#6366f1',
      warning: '#f59e0b',
      error: '#ef4444',
      text: isDark ? '#f1f5f9' : '#1f2937',
      grid: isDark ? '#475569' : '#e5e7eb',
      background: isDark ? '#334155' : '#ffffff'
    };
  }

  /**
   * Get default chart options
   * @returns {Object} Chart.js options object
   */
  static getDefaultOptions() {
    const colors = this.getChartColors();
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.text,
            usePointStyle: true,
            padding: 20
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: colors.text
          },
          grid: {
            color: colors.grid
          }
        },
        y: {
          ticks: {
            color: colors.text
          },
          grid: {
            color: colors.grid
          }
        }
      }
    };
  }
}

// ===== MEAL DATA MANAGEMENT =====
class MealManager {
  /**
   * Get all meals from storage
   * @returns {Array<Object>} Array of meal objects
   */
  static getAllMeals() {
    return StorageManager.get(APP_CONFIG.storage.keys.meals, []);
  }

  /**
   * Save meal to storage
   * @param {Object} meal - Meal object
   * @returns {boolean} Success status
   */
  static saveMeal(meal) {
    const meals = this.getAllMeals();
    const mealWithId = {
      ...meal,
      id: this.generateId(),
      dateAdded: new Date().toISOString()
    };
    
    meals.push(mealWithId);
    return StorageManager.set(APP_CONFIG.storage.keys.meals, meals);
  }

  /**
   * Get meals for specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Array<Object>} Array of meals for the date
   */
  static getMealsForDate(date) {
    const meals = this.getAllMeals();
    return meals.filter(meal => meal.date === date);
  }

  /**
   * Get meals for current week
   * @returns {Array<Object>} Array of meals for current week
   */
  static getWeekMeals() {
    const weekDates = DateUtils.getWeekDates();
    const meals = this.getAllMeals();
    return meals.filter(meal => weekDates.includes(meal.date));
  }

  /**
   * Delete meal by ID
   * @param {string} mealId - Meal ID
   * @returns {boolean} Success status
   */
  static deleteMeal(mealId) {
    const meals = this.getAllMeals();
    const filteredMeals = meals.filter(meal => meal.id !== mealId);
    return StorageManager.set(APP_CONFIG.storage.keys.meals, filteredMeals);
  }

  /**
   * Generate unique ID for meals
   * @returns {string} Unique ID
   */
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Calculate total nutrition for meals array
   * @param {Array<Object>} meals - Array of meal objects
   * @returns {Object} Total nutrition object
   */
  static calculateTotalNutrition(meals) {
    return meals.reduce((total, meal) => ({
      calories: total.calories + (meal.calories || 0),
      protein: total.protein + (meal.protein || 0),
      carbs: total.carbs + (meal.carbs || 0),
      fats: total.fats + (meal.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }
}

// ===== MEAL LIBRARY MANAGEMENT =====
class MealLibraryManager {
  /**
   * Get all library meals from storage
   * @returns {Array<Object>} Array of library meal objects
   */
  static getLibraryMeals() {
    return StorageManager.get(APP_CONFIG.storage.keys.mealLibrary, this.getDefaultMeals());
  }

  /**
   * Save meal to library
   * @param {Object} meal - Meal object
   * @returns {boolean} Success status
   */
  static saveToLibrary(meal) {
    const libraryMeals = this.getLibraryMeals();
    const libraryMeal = {
      ...meal,
      id: MealManager.generateId(),
      dateAdded: new Date().toISOString(),
      isDefault: false
    };
    
    libraryMeals.push(libraryMeal);
    return StorageManager.set(APP_CONFIG.storage.keys.mealLibrary, libraryMeals);
  }

  /**
   * Delete meal from library
   * @param {string} mealId - Meal ID
   * @returns {boolean} Success status
   */
  static deleteFromLibrary(mealId) {
    const libraryMeals = this.getLibraryMeals();
    const filteredMeals = libraryMeals.filter(meal => meal.id !== mealId);
    return StorageManager.set(APP_CONFIG.storage.keys.mealLibrary, filteredMeals);
  }

  /**
   * Get default meals for new users
   * @returns {Array<Object>} Array of default meal objects
   */
  static getDefaultMeals() {
    return [
      {
        id: 'default_1',
        foodItem: 'Grilled Chicken Breast',
        calories: 284,
        protein: 53.4,
        carbs: 0,
        fats: 6.2,
        servingSize: '150g',
        mealType: 'lunch',
        isDefault: true,
        dateAdded: new Date().toISOString()
      },
      {
        id: 'default_2',
        foodItem: 'Greek Yogurt with Berries',
        calories: 150,
        protein: 15,
        carbs: 20,
        fats: 2,
        servingSize: '1 cup',
        mealType: 'breakfast',
        isDefault: true,
        dateAdded: new Date().toISOString()
      },
      {
        id: 'default_3',
        foodItem: 'Quinoa Salad',
        calories: 320,
        protein: 12,
        carbs: 58,
        fats: 6,
        servingSize: '1 cup',
        mealType: 'lunch',
        isDefault: true,
        dateAdded: new Date().toISOString()
      },
      {
        id: 'default_4',
        foodItem: 'Salmon with Sweet Potato',
        calories: 450,
        protein: 35,
        carbs: 45,
        fats: 15,
        servingSize: '200g salmon + 150g sweet potato',
        mealType: 'dinner',
        isDefault: true,
        dateAdded: new Date().toISOString()
      },
      {
        id: 'default_5',
        foodItem: 'Protein Smoothie',
        calories: 280,
        protein: 25,
        carbs: 35,
        fats: 5,
        servingSize: '1 large glass',
        mealType: 'snack',
        isDefault: true,
        dateAdded: new Date().toISOString()
      },
      {
        id: 'default_6',
        foodItem: 'Oatmeal with Banana',
        calories: 300,
        protein: 10,
        carbs: 54,
        fats: 6,
        servingSize: '1 bowl',
        mealType: 'breakfast',
        isDefault: true,
        dateAdded: new Date().toISOString()
      }
    ];
  }
}

// ===== PROFILE MANAGEMENT =====
class ProfileManager {
  /**
   * Get user profile from storage
   * @returns {Object} User profile object
   */
  static getProfile() {
    return StorageManager.get(APP_CONFIG.storage.keys.profile, APP_CONFIG.defaults.profile);
  }

  /**
   * Save user profile to storage
   * @param {Object} profile - Profile object
   * @returns {boolean} Success status
   */
  static saveProfile(profile) {
    return StorageManager.set(APP_CONFIG.storage.keys.profile, profile);
  }

  /**
   * Get user goals from storage
   * @returns {Object} User goals object
   */
  static getGoals() {
    return StorageManager.get(APP_CONFIG.storage.keys.goals, APP_CONFIG.defaults.goals);
  }

  /**
   * Save user goals to storage
   * @param {Object} goals - Goals object
   * @returns {boolean} Success status
   */
  static saveGoals(goals) {
    return StorageManager.set(APP_CONFIG.storage.keys.goals, goals);
  }

  /**
   * Calculate BMI from height and weight
   * @param {number} height - Height in cm
   * @param {number} weight - Weight in kg
   * @returns {number} BMI value
   */
  static calculateBMI(height, weight) {
    if (!height || !weight) return null;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  /**
   * Get BMI category
   * @param {number} bmi - BMI value
   * @returns {string} BMI category
   */
  static getBMICategory(bmi) {
    if (!bmi) return 'Unknown';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  /**
   * Calculate daily calorie needs using Mifflin-St Jeor Equation
   * @param {Object} profile - User profile
   * @returns {number} Daily calorie needs
   */
  static calculateDailyCalories(profile) {
    const { age, gender, height, weight, activityLevel, goal } = profile;
    
    if (!age || !gender || !height || !weight || !activityLevel) {
      return null;
    }

    // Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      'very-active': 1.9
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

    // Goal adjustments
    const goalAdjustments = {
      'lose-weight': -500,
      'maintain-weight': 0,
      'gain-weight': 500,
      'build-muscle': 300,
      'improve-performance': 0
    };

    return Math.round(tdee + (goalAdjustments[goal] || 0));
  }

  /**
   * Calculate macro goals based on calories and goal
   * @param {number} calories - Daily calories
   * @param {string} goal - User goal
   * @returns {Object} Macro goals object
   */
  static calculateMacroGoals(calories, goal) {
    if (!calories) return null;

    // Macro ratios based on goal
    const macroRatios = {
      'lose-weight': { protein: 0.3, carbs: 0.35, fats: 0.35 },
      'maintain-weight': { protein: 0.25, carbs: 0.45, fats: 0.3 },
      'gain-weight': { protein: 0.25, carbs: 0.5, fats: 0.25 },
      'build-muscle': { protein: 0.3, carbs: 0.4, fats: 0.3 },
      'improve-performance': { protein: 0.2, carbs: 0.6, fats: 0.2 }
    };

    const ratios = macroRatios[goal] || macroRatios['maintain-weight'];

    return {
      protein: Math.round((calories * ratios.protein) / 4), // 4 calories per gram
      carbs: Math.round((calories * ratios.carbs) / 4), // 4 calories per gram
      fats: Math.round((calories * ratios.fats) / 9) // 9 calories per gram
    };
  }
}

// ===== APPLICATION INITIALIZATION =====
class App {
  constructor() {
    this.themeManager = null;
    this.navigationManager = null;
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.setupEventListeners();
    this.initializeManagers();
    this.setupGlobalErrorHandling();
    this.loadInitialData();
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }

    // Window events
    window.addEventListener('beforeunload', () => this.onBeforeUnload());
    window.addEventListener('storage', (e) => this.onStorageChange(e));
  }

  /**
   * Initialize manager classes
   */
  initializeManagers() {
    this.themeManager = new ThemeManager();
    this.navigationManager = new NavigationManager();
  }

  /**
   * Setup global error handling
   */
  setupGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      NotificationManager.showError('An unexpected error occurred. Please try again.');
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      NotificationManager.showError('An unexpected error occurred. Please try again.');
    });
  }

  /**
   * Load initial application data
   */
  loadInitialData() {
    // Initialize default data if first time user
    const profile = ProfileManager.getProfile();
    if (!profile.firstName && !profile.lastName) {
      // First time user - could show onboarding in future
      console.log('Welcome to NutriPlan!');
    }

    // Ensure meal library has default meals
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    if (libraryMeals.length === 0) {
      StorageManager.set(APP_CONFIG.storage.keys.mealLibrary, MealLibraryManager.getDefaultMeals());
    }
  }

  /**
   * Handle DOM ready event
   */
  onDOMReady() {
    // Add fade-in animation to main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      AnimationUtils.fadeIn(mainContent);
    }

    // Initialize page-specific functionality
    this.initializePageSpecific();
  }

  /**
   * Initialize page-specific functionality based on current page
   */
  initializePageSpecific() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch (currentPage) {
      case 'dashboard.html':
        if (window.DashboardManager) {
          new window.DashboardManager();
        }
        break;
      case 'meal-planner.html':
        if (window.MealPlannerManager) {
          new window.MealPlannerManager();
        }
        break;
      case 'progress.html':
        if (window.ProgressManager) {
          new window.ProgressManager();
        }
        break;
      case 'meal-library.html':
        if (window.MealLibraryPageManager) {
          new window.MealLibraryPageManager();
        }
        break;
      case 'profile.html':
        if (window.ProfilePageManager) {
          new window.ProfilePageManager();
        }
        break;
    }
  }

  /**
   * Handle before unload event
   */
  onBeforeUnload() {
    // Save any pending data or cleanup
    console.log('Application closing...');
  }

  /**
   * Handle storage change events (for multi-tab sync)
   * @param {StorageEvent} event - Storage event
   */
  onStorageChange(event) {
    if (event.key && event.key.startsWith(APP_CONFIG.storage.prefix)) {
      // Handle data sync between tabs
      console.log('Storage changed:', event.key);
      
      // Refresh current page data if needed
      if (event.key.includes('meals') || event.key.includes('profile')) {
        this.refreshPageData();
      }
    }
  }

  /**
   * Refresh current page data
   */
  refreshPageData() {
    // Trigger page-specific refresh
    const event = new CustomEvent('dataRefresh');
    document.dispatchEvent(event);
  }
}

// ===== INITIALIZE APPLICATION =====
// Create global app instance when script loads
window.app = new App();

// Add CSS animation styles for notifications
const notificationStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// ===== EXPORT FOR MODULE USAGE =====
// Make classes available globally for other scripts
window.StorageManager = StorageManager;
window.DateUtils = DateUtils;
window.ValidationUtils = ValidationUtils;
window.ThemeManager = ThemeManager;
window.NavigationManager = NavigationManager;
window.NotificationManager = NotificationManager;
window.FormUtils = FormUtils;
window.AnimationUtils = AnimationUtils;
window.ChartUtils = ChartUtils;
window.MealManager = MealManager;
window.MealLibraryManager = MealLibraryManager;
window.ProfileManager = ProfileManager;
window.APP_CONFIG = APP_CONFIG;
