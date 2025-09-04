/**
 * Meal Planner Page JavaScript
 * Handles meal planning form, today's meals display, and weekly overview
 */

class MealPlannerManager {
  constructor() {
    this.currentDate = DateUtils.getCurrentDate();
    this.init();
  }

  /**
   * Initialize meal planner functionality
   */
  init() {
    this.setupForm();
    this.setupEventListeners();
    this.loadTodaysMeals();
    this.loadWeeklyOverview();
    this.updateCurrentDate();
  }

  /**
   * Setup meal planning form
   */
  setupForm() {
    const form = document.getElementById('meal-form');
    if (!form) return;

    // Set default date to today
    const dateInput = document.getElementById('meal-date');
    if (dateInput) {
      dateInput.value = this.currentDate;
    }

    // Form submission handler
    form.addEventListener('submit', (e) => this.handleFormSubmit(e));

    // Save to library button handler
    const saveToLibraryBtn = document.getElementById('save-to-library');
    if (saveToLibraryBtn) {
      saveToLibraryBtn.addEventListener('click', () => this.handleSaveToLibrary());
    }

    // Auto-calculate calories from macros
    this.setupMacroCalculation();
  }

  /**
   * Setup macro calculation functionality
   */
  setupMacroCalculation() {
    const proteinInput = document.getElementById('protein');
    const carbsInput = document.getElementById('carbs');
    const fatsInput = document.getElementById('fats');
    const caloriesInput = document.getElementById('calories');

    if (!proteinInput || !carbsInput || !fatsInput || !caloriesInput) return;

    const calculateCalories = () => {
      const protein = parseFloat(proteinInput.value) || 0;
      const carbs = parseFloat(carbsInput.value) || 0;
      const fats = parseFloat(fatsInput.value) || 0;

      // Calculate calories: Protein & Carbs = 4 cal/g, Fats = 9 cal/g
      const totalCalories = (protein * 4) + (carbs * 4) + (fats * 9);
      
      if (totalCalories > 0) {
        caloriesInput.value = Math.round(totalCalories);
      }
    };

    // Add event listeners for real-time calculation
    [proteinInput, carbsInput, fatsInput].forEach(input => {
      input.addEventListener('input', calculateCalories);
      input.addEventListener('blur', calculateCalories);
    });
  }

  /**
   * Setup additional event listeners
   */
  setupEventListeners() {
    // Date change handler
    const dateInput = document.getElementById('meal-date');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        this.currentDate = e.target.value;
        this.loadTodaysMeals();
      });
    }

    // Listen for storage changes
    window.addEventListener('storage', () => {
      this.refreshData();
    });
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = FormUtils.getFormData(form);

    // Validate required fields
    const requiredFields = ['date', 'mealType', 'foodItem', 'calories', 'protein', 'carbs', 'fats'];
    const validation = ValidationUtils.validateRequired(formData, requiredFields);

    if (!validation.isValid) {
      FormUtils.showErrors(form, validation.errors);
      return;
    }

    // Additional validation
    if (!ValidationUtils.isValidNumber(formData.calories, 1, 10000)) {
      NotificationManager.showError('Please enter a valid calorie amount (1-10000)');
      return;
    }

    if (!ValidationUtils.isValidNumber(formData.protein, 0, 1000) ||
        !ValidationUtils.isValidNumber(formData.carbs, 0, 1000) ||
        !ValidationUtils.isValidNumber(formData.fats, 0, 1000)) {
      NotificationManager.showError('Please enter valid macro amounts (0-1000g)');
      return;
    }

    // Save meal
    const success = MealManager.saveMeal(formData);
    
    if (success) {
      NotificationManager.showSuccess('Meal added successfully!');
      FormUtils.resetForm(form);
      
      // Reset date to current selection
      const dateInput = document.getElementById('meal-date');
      if (dateInput) {
        dateInput.value = this.currentDate;
      }

      // Refresh displays
      this.loadTodaysMeals();
      this.loadWeeklyOverview();
      
      // Trigger dashboard refresh if on same page
      document.dispatchEvent(new CustomEvent('dataRefresh'));
    } else {
      NotificationManager.showError('Failed to save meal. Please try again.');
    }
  }

  /**
   * Handle save to library action
   */
  handleSaveToLibrary() {
    const form = document.getElementById('meal-form');
    if (!form) return;

    const formData = FormUtils.getFormData(form);

    // Validate required fields for library save
    const requiredFields = ['foodItem', 'calories', 'protein', 'carbs', 'fats'];
    const validation = ValidationUtils.validateRequired(formData, requiredFields);

    if (!validation.isValid) {
      NotificationManager.showError('Please fill in all nutrition information before saving to library');
      return;
    }

    // Save to library
    const success = MealLibraryManager.saveToLibrary(formData);
    
    if (success) {
      NotificationManager.showSuccess('Meal saved to library!');
    } else {
      NotificationManager.showError('Failed to save meal to library. Please try again.');
    }
  }

  /**
   * Load and display today's meals
   */
  loadTodaysMeals() {
    const todaysMealsContainer = document.getElementById('todays-meals');
    if (!todaysMealsContainer) return;

    const todaysMeals = MealManager.getMealsForDate(this.currentDate);

    if (todaysMeals.length === 0) {
      todaysMealsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <h4>No meals planned for today</h4>
          <p>Use the form above to add your first meal!</p>
        </div>
      `;
      return;
    }

    // Group meals by type
    const mealsByType = this.groupMealsByType(todaysMeals);
    
    todaysMealsContainer.innerHTML = Object.entries(mealsByType).map(([type, meals]) => `
      <div class="meal-type-section">
        <h4 class="meal-type-title">${this.formatMealType(type)}</h4>
        <div class="meal-type-meals">
          ${meals.map(meal => this.renderMealCard(meal)).join('')}
        </div>
      </div>
    `).join('');

    // Add delete functionality to meal cards
    this.setupMealCardActions(todaysMealsContainer);
  }

  /**
   * Group meals by meal type
   * @param {Array<Object>} meals - Array of meal objects
   * @returns {Object} Meals grouped by type
   */
  groupMealsByType(meals) {
    return meals.reduce((groups, meal) => {
      const type = meal.mealType || 'other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(meal);
      return groups;
    }, {});
  }

  /**
   * Format meal type for display
   * @param {string} type - Meal type
   * @returns {string} Formatted meal type
   */
  formatMealType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Render individual meal card
   * @param {Object} meal - Meal object
   * @returns {string} HTML string for meal card
   */
  renderMealCard(meal) {
    return `
      <div class="meal-card" data-meal-id="${meal.id}">
        <div class="meal-header">
          <div class="meal-info">
            <h5>${ValidationUtils.sanitizeHTML(meal.foodItem)}</h5>
            ${meal.servingSize ? `<p class="serving-size">${ValidationUtils.sanitizeHTML(meal.servingSize)}</p>` : ''}
          </div>
          <div class="meal-actions">
            <button class="btn-icon delete-meal" data-meal-id="${meal.id}" aria-label="Delete meal">🗑️</button>
          </div>
        </div>
        <div class="meal-nutrition">
          <div class="nutrition-item">
            <span class="nutrition-value">${meal.calories}</span>
            <span class="nutrition-label">Calories</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-value">${meal.protein.toFixed(1)}g</span>
            <span class="nutrition-label">Protein</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-value">${meal.carbs.toFixed(1)}g</span>
            <span class="nutrition-label">Carbs</span>
          </div>
          <div class="nutrition-item">
            <span class="nutrition-value">${meal.fats.toFixed(1)}g</span>
            <span class="nutrition-label">Fats</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup meal card action handlers
   * @param {HTMLElement} container - Container element
   */
  setupMealCardActions(container) {
    const deleteButtons = container.querySelectorAll('.delete-meal');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const mealId = button.getAttribute('data-meal-id');
        this.deleteMeal(mealId);
      });
    });
  }

  /**
   * Delete meal with confirmation
   * @param {string} mealId - Meal ID to delete
   */
  deleteMeal(mealId) {
    if (confirm('Are you sure you want to delete this meal?')) {
      const success = MealManager.deleteMeal(mealId);
      
      if (success) {
        NotificationManager.showSuccess('Meal deleted successfully!');
        this.loadTodaysMeals();
        this.loadWeeklyOverview();
        
        // Trigger dashboard refresh
        document.dispatchEvent(new CustomEvent('dataRefresh'));
      } else {
        NotificationManager.showError('Failed to delete meal. Please try again.');
      }
    }
  }

  /**
   * Load and display weekly overview
   */
  loadWeeklyOverview() {
    const weekGrid = document.getElementById('week-grid');
    if (!weekGrid) return;

    const weekDates = DateUtils.getWeekDates();
    const weekMeals = MealManager.getWeekMeals();

    weekGrid.innerHTML = weekDates.map(date => {
      const dayMeals = weekMeals.filter(meal => meal.date === date);
      const dayNutrition = MealManager.calculateTotalNutrition(dayMeals);
      
      return `
        <div class="day-card ${date === this.currentDate ? 'current-day' : ''}" data-date="${date}">
          <div class="day-header">
            <div class="day-name">${DateUtils.getShortDayName(date)}</div>
            <div class="day-date">${new Date(date).getDate()}</div>
          </div>
          <div class="day-summary">
            <div class="day-calories">${dayNutrition.calories} cal</div>
            <div class="day-meals-count">${dayMeals.length} meal${dayMeals.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="day-meals">
            ${dayMeals.slice(0, 3).map(meal => `
              <div class="day-meal" title="${ValidationUtils.sanitizeHTML(meal.foodItem)}">
                ${meal.foodItem.length > 15 ? meal.foodItem.substring(0, 15) + '...' : meal.foodItem}
              </div>
            `).join('')}
            ${dayMeals.length > 3 ? `<div class="day-meal more">+${dayMeals.length - 3} more</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers for day cards
    this.setupDayCardActions(weekGrid);
  }

  /**
   * Setup day card click actions
   * @param {HTMLElement} weekGrid - Week grid container
   */
  setupDayCardActions(weekGrid) {
    const dayCards = weekGrid.querySelectorAll('.day-card');
    dayCards.forEach(card => {
      card.addEventListener('click', () => {
        const date = card.getAttribute('data-date');
        this.selectDate(date);
      });
    });
  }

  /**
   * Select a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  selectDate(date) {
    this.currentDate = date;
    
    // Update form date
    const dateInput = document.getElementById('meal-date');
    if (dateInput) {
      dateInput.value = date;
    }

    // Update current date display
    this.updateCurrentDate();
    
    // Reload today's meals for selected date
    this.loadTodaysMeals();
    
    // Update week grid highlighting
    this.updateWeekGridHighlight();
  }

  /**
   * Update current date display
   */
  updateCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
      currentDateElement.textContent = DateUtils.formatDisplayDate(this.currentDate);
    }
  }

  /**
   * Update week grid highlighting for current selected date
   */
  updateWeekGridHighlight() {
    const dayCards = document.querySelectorAll('.day-card');
    dayCards.forEach(card => {
      const cardDate = card.getAttribute('data-date');
      if (cardDate === this.currentDate) {
        card.classList.add('current-day');
      } else {
        card.classList.remove('current-day');
      }
    });
  }

  /**
   * Setup additional event listeners
   */
  setupEventListeners() {
    // Listen for data refresh events
    document.addEventListener('dataRefresh', () => this.refreshData());
    
    // Listen for library meal additions
    document.addEventListener('mealAddedToLibrary', () => {
      NotificationManager.showInfo('Meal saved to library!');
    });
  }

  /**
   * Refresh all meal planner data
   */
  refreshData() {
    this.loadTodaysMeals();
    this.loadWeeklyOverview();
  }

  /**
   * Validate meal form data
   * @param {Object} formData - Form data object
   * @returns {Object} Validation result
   */
  validateMealData(formData) {
    const errors = [];

    // Required field validation
    const requiredFields = ['date', 'mealType', 'foodItem', 'calories', 'protein', 'carbs', 'fats'];
    const requiredValidation = ValidationUtils.validateRequired(formData, requiredFields);
    
    if (!requiredValidation.isValid) {
      errors.push(...requiredValidation.errors);
    }

    // Numeric validation
    if (formData.calories && !ValidationUtils.isValidNumber(formData.calories, 1, 10000)) {
      errors.push('Calories must be between 1 and 10000');
    }

    if (formData.protein && !ValidationUtils.isValidNumber(formData.protein, 0, 1000)) {
      errors.push('Protein must be between 0 and 1000g');
    }

    if (formData.carbs && !ValidationUtils.isValidNumber(formData.carbs, 0, 1000)) {
      errors.push('Carbohydrates must be between 0 and 1000g');
    }

    if (formData.fats && !ValidationUtils.isValidNumber(formData.fats, 0, 1000)) {
      errors.push('Fats must be between 0 and 1000g');
    }

    // Date validation
    const selectedDate = new Date(formData.date);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 365); // Allow planning up to 1 year ahead

    if (selectedDate > maxDate) {
      errors.push('Date cannot be more than 1 year in the future');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get meal type emoji
   * @param {string} mealType - Meal type
   * @returns {string} Emoji for meal type
   */
  getMealTypeEmoji(mealType) {
    const emojis = {
      breakfast: '🌅',
      lunch: '🌞',
      dinner: '🌙',
      snack: '🍎'
    };
    return emojis[mealType] || '🍽️';
  }

  /**
   * Calculate daily nutrition summary
   * @param {Array<Object>} meals - Meals for the day
   * @returns {Object} Daily nutrition summary
   */
  calculateDailySummary(meals) {
    const totalNutrition = MealManager.calculateTotalNutrition(meals);
    const goals = ProfileManager.getGoals();

    return {
      ...totalNutrition,
      goals,
      percentages: {
        calories: goals.calorieGoal ? Math.round((totalNutrition.calories / goals.calorieGoal) * 100) : 0,
        protein: goals.proteinGoal ? Math.round((totalNutrition.protein / goals.proteinGoal) * 100) : 0,
        carbs: goals.carbsGoal ? Math.round((totalNutrition.carbs / goals.carbsGoal) * 100) : 0,
        fats: goals.fatsGoal ? Math.round((totalNutrition.fats / goals.fatsGoal) * 100) : 0
      }
    };
  }

  /**
   * Show quick add meal options from library
   */
  showQuickAddOptions() {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    
    if (libraryMeals.length === 0) {
      NotificationManager.showInfo('No saved meals available. Add meals to your library first!');
      return;
    }

    // Create quick add modal (simplified version)
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Quick Add from Library</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="quick-add-grid">
            ${libraryMeals.slice(0, 6).map(meal => `
              <div class="quick-add-card" data-meal-id="${meal.id}">
                <h5>${ValidationUtils.sanitizeHTML(meal.foodItem)}</h5>
                <p>${meal.calories} cal</p>
                <div class="quick-add-macros">
                  <span>P: ${meal.protein.toFixed(1)}g</span>
                  <span>C: ${meal.carbs.toFixed(1)}g</span>
                  <span>F: ${meal.fats.toFixed(1)}g</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup modal event handlers
    this.setupQuickAddModal(modal);
  }

  /**
   * Setup quick add modal functionality
   * @param {HTMLElement} modal - Modal element
   */
  setupQuickAddModal(modal) {
    const closeBtn = modal.querySelector('.modal-close');
    const quickAddCards = modal.querySelectorAll('.quick-add-card');

    // Close modal handler
    const closeModal = () => {
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Quick add handlers
    quickAddCards.forEach(card => {
      card.addEventListener('click', () => {
        const mealId = card.getAttribute('data-meal-id');
        this.quickAddMeal(mealId);
        closeModal();
      });
    });
  }

  /**
   * Quick add meal from library
   * @param {string} mealId - Library meal ID
   */
  quickAddMeal(mealId) {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    const libraryMeal = libraryMeals.find(meal => meal.id === mealId);
    
    if (!libraryMeal) {
      NotificationManager.showError('Meal not found in library');
      return;
    }

    // Create meal object for current date
    const mealData = {
      date: this.currentDate,
      mealType: libraryMeal.mealType || 'snack',
      foodItem: libraryMeal.foodItem,
      calories: libraryMeal.calories,
      protein: libraryMeal.protein,
      carbs: libraryMeal.carbs,
      fats: libraryMeal.fats,
      servingSize: libraryMeal.servingSize || ''
    };

    const success = MealManager.saveMeal(mealData);
    
    if (success) {
      NotificationManager.showSuccess(`${libraryMeal.foodItem} added to ${DateUtils.formatDisplayDate(this.currentDate)}!`);
      this.refreshData();
      document.dispatchEvent(new CustomEvent('dataRefresh'));
    } else {
      NotificationManager.showError('Failed to add meal. Please try again.');
    }
  }
}

// ===== INITIALIZE MEAL PLANNER =====
// Make MealPlannerManager available globally
window.MealPlannerManager = MealPlannerManager;

// Auto-initialize if we're on the meal planner page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('meal-planner.html')) {
      new MealPlannerManager();
    }
  });
} else {
  if (window.location.pathname.includes('meal-planner.html')) {
    new MealPlannerManager();
  }
}
