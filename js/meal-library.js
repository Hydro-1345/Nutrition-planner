/**
 * Meal Library Page JavaScript
 * Handles meal library display, search, filtering, and management
 */

class MealLibraryPageManager {
  constructor() {
    this.filteredMeals = [];
    this.currentFilter = '';
    this.currentSort = 'name';
    this.searchTerm = '';
    this.init();
  }

  /**
   * Initialize meal library functionality
   */
  init() {
    this.setupEventListeners();
    this.loadLibraryMeals();
    this.setupModal();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('meal-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.filterAndDisplayMeals();
      });
    }

    // Filter by meal type
    const typeFilter = document.getElementById('meal-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.filterAndDisplayMeals();
      });
    }

    // Sort functionality
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.filterAndDisplayMeals();
      });
    }

    // Listen for data refresh events
    document.addEventListener('dataRefresh', () => this.refreshData());
    
    // Listen for library updates
    document.addEventListener('mealAddedToLibrary', () => this.refreshData());
  }

  /**
   * Load and display library meals
   */
  loadLibraryMeals() {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    this.filteredMeals = [...libraryMeals];
    this.filterAndDisplayMeals();
  }

  /**
   * Filter and display meals based on current filters
   */
  filterAndDisplayMeals() {
    let meals = MealLibraryManager.getLibraryMeals();

    // Apply search filter
    if (this.searchTerm) {
      meals = meals.filter(meal => 
        meal.foodItem.toLowerCase().includes(this.searchTerm) ||
        (meal.servingSize && meal.servingSize.toLowerCase().includes(this.searchTerm))
      );
    }

    // Apply meal type filter
    if (this.currentFilter) {
      meals = meals.filter(meal => meal.mealType === this.currentFilter);
    }

    // Apply sorting
    meals = this.sortMeals(meals, this.currentSort);

    this.filteredMeals = meals;
    this.displayMeals(meals);
  }

  /**
   * Sort meals by specified criteria
   * @param {Array<Object>} meals - Meals to sort
   * @param {string} sortBy - Sort criteria
   * @returns {Array<Object>} Sorted meals
   */
  sortMeals(meals, sortBy) {
    const sortedMeals = [...meals];

    switch (sortBy) {
      case 'name':
        return sortedMeals.sort((a, b) => a.foodItem.localeCompare(b.foodItem));
      
      case 'calories':
        return sortedMeals.sort((a, b) => b.calories - a.calories);
      
      case 'protein':
        return sortedMeals.sort((a, b) => b.protein - a.protein);
      
      case 'date':
        return sortedMeals.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      default:
        return sortedMeals;
    }
  }

  /**
   * Display meals in the library grid
   * @param {Array<Object>} meals - Meals to display
   */
  displayMeals(meals) {
    const libraryGrid = document.getElementById('library-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!libraryGrid) return;

    if (meals.length === 0) {
      libraryGrid.style.display = 'none';
      if (emptyState) {
        emptyState.style.display = 'block';
      }
      return;
    }

    libraryGrid.style.display = 'grid';
    if (emptyState) {
      emptyState.style.display = 'none';
    }

    libraryGrid.innerHTML = meals.map(meal => this.renderLibraryMealCard(meal)).join('');

    // Setup meal card interactions
    this.setupMealCardInteractions(libraryGrid);

    // Add staggered animation
    const mealCards = libraryGrid.querySelectorAll('.library-meal-card');
    AnimationUtils.staggerFadeIn(mealCards, 50);
  }

  /**
   * Render library meal card
   * @param {Object} meal - Meal object
   * @returns {string} HTML string for meal card
   */
  renderLibraryMealCard(meal) {
    const isDefault = meal.isDefault;
    
    return `
      <div class="library-meal-card ${isDefault ? 'default-meal' : ''}" 
           data-meal-id="${meal.id}" 
           tabindex="0" 
           role="button"
           aria-label="View details for ${ValidationUtils.sanitizeHTML(meal.foodItem)}">
        <div class="library-meal-header">
          <h4>${ValidationUtils.sanitizeHTML(meal.foodItem)}</h4>
          ${isDefault ? '<span class="default-badge">Default</span>' : ''}
        </div>
        
        <div class="library-meal-meta">
          <span class="meal-type-badge">${this.formatMealType(meal.mealType)}</span>
          ${meal.servingSize ? `<span class="serving-size">${ValidationUtils.sanitizeHTML(meal.servingSize)}</span>` : ''}
        </div>
        
        <div class="library-meal-nutrition">
          <div class="nutrition-highlight">
            <span class="calories-large">${meal.calories}</span>
            <span class="calories-label">calories</span>
          </div>
          
          <div class="macro-summary">
            <div class="macro-item">
              <span class="macro-value">${meal.protein.toFixed(1)}g</span>
              <span class="macro-label">Protein</span>
            </div>
            <div class="macro-item">
              <span class="macro-value">${meal.carbs.toFixed(1)}g</span>
              <span class="macro-label">Carbs</span>
            </div>
            <div class="macro-item">
              <span class="macro-value">${meal.fats.toFixed(1)}g</span>
              <span class="macro-label">Fats</span>
            </div>
          </div>
        </div>
        
        <div class="library-meal-actions">
          <button class="btn btn-sm btn-primary quick-add-btn" 
                  data-meal-id="${meal.id}"
                  aria-label="Quick add ${ValidationUtils.sanitizeHTML(meal.foodItem)}">
            Quick Add
          </button>
          ${!isDefault ? `
            <button class="btn btn-sm btn-danger delete-library-meal" 
                    data-meal-id="${meal.id}"
                    aria-label="Delete ${ValidationUtils.sanitizeHTML(meal.foodItem)}">
              Delete
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Format meal type for display
   * @param {string} type - Meal type
   * @returns {string} Formatted meal type
   */
  formatMealType(type) {
    if (!type) return 'Other';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Setup meal card interactions
   * @param {HTMLElement} container - Container element
   */
  setupMealCardInteractions(container) {
    // Meal card click handlers (for details modal)
    const mealCards = container.querySelectorAll('.library-meal-card');
    mealCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest('.library-meal-actions')) return;
        
        const mealId = card.getAttribute('data-meal-id');
        this.showMealDetails(mealId);
      });

      // Keyboard accessibility
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const mealId = card.getAttribute('data-meal-id');
          this.showMealDetails(mealId);
        }
      });
    });

    // Quick add button handlers
    const quickAddButtons = container.querySelectorAll('.quick-add-btn');
    quickAddButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const mealId = button.getAttribute('data-meal-id');
        this.quickAddMeal(mealId);
      });
    });

    // Delete button handlers
    const deleteButtons = container.querySelectorAll('.delete-library-meal');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const mealId = button.getAttribute('data-meal-id');
        this.deleteLibraryMeal(mealId);
      });
    });
  }

  /**
   * Show meal details in modal
   * @param {string} mealId - Meal ID
   */
  showMealDetails(mealId) {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    const meal = libraryMeals.find(m => m.id === mealId);
    
    if (!meal) {
      NotificationManager.showError('Meal not found');
      return;
    }

    const modal = document.getElementById('meal-modal');
    const modalName = document.getElementById('modal-meal-name');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalName || !modalBody) return;

    // Update modal content
    modalName.textContent = meal.foodItem;
    modalBody.innerHTML = `
      <div class="meal-detail-content">
        <div class="meal-detail-header">
          <div class="meal-type-info">
            <span class="meal-type-badge large">${this.formatMealType(meal.mealType)}</span>
            ${meal.servingSize ? `<span class="serving-info">${ValidationUtils.sanitizeHTML(meal.servingSize)}</span>` : ''}
          </div>
          ${meal.isDefault ? '<span class="default-badge">Default Meal</span>' : ''}
        </div>
        
        <div class="nutrition-details">
          <div class="nutrition-detail-card">
            <h5>Calories</h5>
            <span class="nutrition-detail-value">${meal.calories}</span>
          </div>
          <div class="nutrition-detail-card">
            <h5>Protein</h5>
            <span class="nutrition-detail-value">${meal.protein.toFixed(1)}g</span>
          </div>
          <div class="nutrition-detail-card">
            <h5>Carbohydrates</h5>
            <span class="nutrition-detail-value">${meal.carbs.toFixed(1)}g</span>
          </div>
          <div class="nutrition-detail-card">
            <h5>Fats</h5>
            <span class="nutrition-detail-value">${meal.fats.toFixed(1)}g</span>
          </div>
        </div>
        
        <div class="meal-detail-meta">
          <p><strong>Added:</strong> ${new Date(meal.dateAdded).toLocaleDateString()}</p>
          ${meal.isDefault ? '<p><em>This is a default meal provided by NutriPlan</em></p>' : ''}
        </div>
      </div>
    `;

    // Setup modal action buttons
    this.setupModalActions(modal, meal);

    // Show modal
    modal.classList.add('show');
  }

  /**
   * Setup modal action buttons
   * @param {HTMLElement} modal - Modal element
   * @param {Object} meal - Meal object
   */
  setupModalActions(modal, meal) {
    const addToPlanBtn = document.getElementById('add-to-plan');
    const deleteMealBtn = document.getElementById('delete-meal');
    const closeBtn = document.getElementById('modal-close');

    // Add to plan handler
    if (addToPlanBtn) {
      addToPlanBtn.onclick = () => {
        this.addMealToPlan(meal);
        modal.classList.remove('show');
      };
    }

    // Delete meal handler
    if (deleteMealBtn) {
      if (meal.isDefault) {
        deleteMealBtn.style.display = 'none';
      } else {
        deleteMealBtn.style.display = 'block';
        deleteMealBtn.onclick = () => {
          this.deleteLibraryMeal(meal.id);
          modal.classList.remove('show');
        };
      }
    }

    // Close modal handlers
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.remove('show');
    }

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    };

    // Keyboard handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        modal.classList.remove('show');
      }
    });
  }

  /**
   * Setup modal functionality
   */
  setupModal() {
    const modal = document.getElementById('meal-modal');
    if (!modal) return;

    // Initially hide modal
    modal.classList.remove('show');
  }

  /**
   * Quick add meal to today's plan
   * @param {string} mealId - Meal ID
   */
  quickAddMeal(mealId) {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    const meal = libraryMeals.find(m => m.id === mealId);
    
    if (!meal) {
      NotificationManager.showError('Meal not found');
      return;
    }

    this.addMealToPlan(meal);
  }

  /**
   * Add meal to meal plan
   * @param {Object} meal - Meal object from library
   */
  addMealToPlan(meal) {
    // Create meal data for today
    const mealData = {
      date: DateUtils.getCurrentDate(),
      mealType: meal.mealType || 'snack',
      foodItem: meal.foodItem,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      servingSize: meal.servingSize || ''
    };

    const success = MealManager.saveMeal(mealData);
    
    if (success) {
      NotificationManager.showSuccess(`${meal.foodItem} added to today's plan!`);
      
      // Trigger dashboard refresh
      document.dispatchEvent(new CustomEvent('dataRefresh'));
    } else {
      NotificationManager.showError('Failed to add meal to plan. Please try again.');
    }
  }

  /**
   * Delete meal from library with confirmation
   * @param {string} mealId - Meal ID to delete
   */
  deleteLibraryMeal(mealId) {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    const meal = libraryMeals.find(m => m.id === mealId);
    
    if (!meal) {
      NotificationManager.showError('Meal not found');
      return;
    }

    if (meal.isDefault) {
      NotificationManager.showError('Cannot delete default meals');
      return;
    }

    if (confirm(`Are you sure you want to delete "${meal.foodItem}" from your library?`)) {
      const success = MealLibraryManager.deleteFromLibrary(mealId);
      
      if (success) {
        NotificationManager.showSuccess('Meal deleted from library!');
        this.refreshData();
      } else {
        NotificationManager.showError('Failed to delete meal. Please try again.');
      }
    }
  }

  /**
   * Show add meal to plan modal with date/meal type selection
   * @param {Object} meal - Meal object
   */
  showAddToPlanModal(meal) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add to Plan: ${ValidationUtils.sanitizeHTML(meal.foodItem)}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="add-to-plan-form">
            <div class="form-group">
              <label for="plan-date">Date</label>
              <input type="date" id="plan-date" name="date" value="${DateUtils.getCurrentDate()}" required>
            </div>
            <div class="form-group">
              <label for="plan-meal-type">Meal Type</label>
              <select id="plan-meal-type" name="mealType" required>
                <option value="breakfast" ${meal.mealType === 'breakfast' ? 'selected' : ''}>Breakfast</option>
                <option value="lunch" ${meal.mealType === 'lunch' ? 'selected' : ''}>Lunch</option>
                <option value="dinner" ${meal.mealType === 'dinner' ? 'selected' : ''}>Dinner</option>
                <option value="snack" ${meal.mealType === 'snack' ? 'selected' : ''}>Snack</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary modal-confirm">Add to Plan</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup modal handlers
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const confirmBtn = modal.querySelector('.modal-confirm');
    const form = modal.querySelector('#add-to-plan-form');

    const closeModal = () => modal.remove();

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    confirmBtn.addEventListener('click', () => {
      const formData = FormUtils.getFormData(form);
      
      const mealData = {
        ...formData,
        foodItem: meal.foodItem,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        servingSize: meal.servingSize || ''
      };

      const success = MealManager.saveMeal(mealData);
      
      if (success) {
        NotificationManager.showSuccess(`${meal.foodItem} added to ${DateUtils.formatDisplayDate(formData.date)}!`);
        document.dispatchEvent(new CustomEvent('dataRefresh'));
      } else {
        NotificationManager.showError('Failed to add meal to plan.');
      }
      
      closeModal();
    });
  }

  /**
   * Setup meal card interactions
   * @param {HTMLElement} container - Container element
   */
  setupMealCardInteractions(container) {
    const mealCards = container.querySelectorAll('.library-meal-card');
    mealCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest('.library-meal-actions')) return;
        
        const mealId = card.getAttribute('data-meal-id');
        this.showMealDetails(mealId);
      });
    });

    // Quick add buttons
    const quickAddButtons = container.querySelectorAll('.quick-add-btn');
    quickAddButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const mealId = button.getAttribute('data-meal-id');
        
        const libraryMeals = MealLibraryManager.getLibraryMeals();
        const meal = libraryMeals.find(m => m.id === mealId);
        
        if (meal) {
          this.showAddToPlanModal(meal);
        }
      });
    });

    // Delete buttons
    const deleteButtons = container.querySelectorAll('.delete-library-meal');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const mealId = button.getAttribute('data-meal-id');
        this.deleteLibraryMeal(mealId);
      });
    });
  }

  /**
   * Filter meals by search term and type
   * @param {Array<Object>} meals - Meals to filter
   * @returns {Array<Object>} Filtered meals
   */
  filterMeals(meals) {
    let filtered = [...meals];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(meal =>
        meal.foodItem.toLowerCase().includes(this.searchTerm) ||
        (meal.servingSize && meal.servingSize.toLowerCase().includes(this.searchTerm)) ||
        meal.mealType.toLowerCase().includes(this.searchTerm)
      );
    }

    // Type filter
    if (this.currentFilter) {
      filtered = filtered.filter(meal => meal.mealType === this.currentFilter);
    }

    return filtered;
  }

  /**
   * Export library meals as JSON
   * @returns {Object} Library export data
   */
  exportLibraryData() {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    const userMeals = libraryMeals.filter(meal => !meal.isDefault);
    
    return {
      meals: userMeals,
      totalCount: userMeals.length,
      exportDate: new Date().toISOString(),
      version: APP_CONFIG.version
    };
  }

  /**
   * Import library meals from JSON data
   * @param {Object} importData - Import data object
   * @returns {boolean} Success status
   */
  importLibraryData(importData) {
    try {
      if (!importData.meals || !Array.isArray(importData.meals)) {
        throw new Error('Invalid import data format');
      }

      const currentLibrary = MealLibraryManager.getLibraryMeals();
      const newMeals = importData.meals.map(meal => ({
        ...meal,
        id: MealManager.generateId(), // Generate new IDs to avoid conflicts
        dateAdded: new Date().toISOString(),
        isDefault: false
      }));

      const updatedLibrary = [...currentLibrary, ...newMeals];
      const success = StorageManager.set(APP_CONFIG.storage.keys.mealLibrary, updatedLibrary);

      if (success) {
        NotificationManager.showSuccess(`Imported ${newMeals.length} meals successfully!`);
        this.refreshData();
        return true;
      } else {
        throw new Error('Failed to save imported meals');
      }
    } catch (error) {
      console.error('Import error:', error);
      NotificationManager.showError('Failed to import meals. Please check the file format.');
      return false;
    }
  }

  /**
   * Get meal statistics for library
   * @returns {Object} Library statistics
   */
  getLibraryStats() {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    const userMeals = libraryMeals.filter(meal => !meal.isDefault);
    
    // Group by meal type
    const mealsByType = libraryMeals.reduce((groups, meal) => {
      const type = meal.mealType || 'other';
      groups[type] = (groups[type] || 0) + 1;
      return groups;
    }, {});

    // Calculate average nutrition
    const totalNutrition = MealManager.calculateTotalNutrition(libraryMeals);
    const avgNutrition = {
      calories: Math.round(totalNutrition.calories / libraryMeals.length),
      protein: Math.round((totalNutrition.protein / libraryMeals.length) * 10) / 10,
      carbs: Math.round((totalNutrition.carbs / libraryMeals.length) * 10) / 10,
      fats: Math.round((totalNutrition.fats / libraryMeals.length) * 10) / 10
    };

    return {
      total: libraryMeals.length,
      userMeals: userMeals.length,
      defaultMeals: libraryMeals.length - userMeals.length,
      byType: mealsByType,
      averageNutrition: avgNutrition
    };
  }

  /**
   * Refresh library data
   */
  refreshData() {
    this.loadLibraryMeals();
  }

  /**
   * Search meals with advanced filters
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array<Object>} Filtered meals
   */
  advancedSearch(query, filters = {}) {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    let results = [...libraryMeals];

    // Text search
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      results = results.filter(meal => {
        const searchableText = `${meal.foodItem} ${meal.servingSize || ''} ${meal.mealType}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Calorie range filter
    if (filters.minCalories || filters.maxCalories) {
      results = results.filter(meal => {
        if (filters.minCalories && meal.calories < filters.minCalories) return false;
        if (filters.maxCalories && meal.calories > filters.maxCalories) return false;
        return true;
      });
    }

    // Protein range filter
    if (filters.minProtein || filters.maxProtein) {
      results = results.filter(meal => {
        if (filters.minProtein && meal.protein < filters.minProtein) return false;
        if (filters.maxProtein && meal.protein > filters.maxProtein) return false;
        return true;
      });
    }

    return results;
  }
}

// ===== MEAL LIBRARY UTILITIES =====
class MealLibraryUtils {
  /**
   * Generate meal suggestions based on user goals
   * @param {Object} userGoals - User nutrition goals
   * @returns {Array<Object>} Suggested meals
   */
  static generateMealSuggestions(userGoals) {
    const libraryMeals = MealLibraryManager.getLibraryMeals();
    const suggestions = [];

    // Find meals that fit within daily goals
    const targetCaloriesPerMeal = userGoals.calorieGoal / 4; // Assuming 3 meals + 1 snack
    
    libraryMeals.forEach(meal => {
      const score = this.calculateMealScore(meal, userGoals, targetCaloriesPerMeal);
      if (score > 0.7) { // Only suggest meals with good fit
        suggestions.push({ ...meal, score });
      }
    });

    // Sort by score and return top suggestions
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  /**
   * Calculate how well a meal fits user goals
   * @param {Object} meal - Meal object
   * @param {Object} goals - User goals
   * @param {number} targetCalories - Target calories per meal
   * @returns {number} Score between 0 and 1
   */
  static calculateMealScore(meal, goals, targetCalories) {
    let score = 0;
    let factors = 0;

    // Calorie fit (within 20% of target)
    const calorieRatio = meal.calories / targetCalories;
    if (calorieRatio >= 0.5 && calorieRatio <= 1.5) {
      score += Math.max(0, 1 - Math.abs(calorieRatio - 1));
      factors++;
    }

    // Protein adequacy
    const proteinPerMeal = goals.proteinGoal / 4;
    const proteinRatio = meal.protein / proteinPerMeal;
    if (proteinRatio >= 0.3) {
      score += Math.min(1, proteinRatio);
      factors++;
    }

    // Macro balance
    const totalMacroCalories = (meal.protein * 4) + (meal.carbs * 4) + (meal.fats * 9);
    if (totalMacroCalories > 0) {
      const proteinPercent = (meal.protein * 4) / totalMacroCalories;
      const carbsPercent = (meal.carbs * 4) / totalMacroCalories;
      const fatsPercent = (meal.fats * 9) / totalMacroCalories;
      
      // Ideal ranges: Protein 20-35%, Carbs 45-65%, Fats 20-35%
      const balanceScore = 
        (proteinPercent >= 0.2 && proteinPercent <= 0.35 ? 1 : 0.5) +
        (carbsPercent >= 0.3 && carbsPercent <= 0.65 ? 1 : 0.5) +
        (fatsPercent >= 0.15 && fatsPercent <= 0.35 ? 1 : 0.5);
      
      score += balanceScore / 3;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Get meal recommendations based on current intake
   * @param {Array<Object>} todaysMeals - Today's meals
   * @param {Object} goals - User goals
   * @returns {Array<Object>} Recommended meals
   */
  static getRecommendations(todaysMeals, goals) {
    const currentNutrition = MealManager.calculateTotalNutrition(todaysMeals);
    const remaining = {
      calories: Math.max(0, goals.calorieGoal - currentNutrition.calories),
      protein: Math.max(0, goals.proteinGoal - currentNutrition.protein),
      carbs: Math.max(0, goals.carbsGoal - currentNutrition.carbs),
      fats: Math.max(0, goals.fatsGoal - currentNutrition.fats)
    };

    const libraryMeals = MealLibraryManager.getLibraryMeals();
    const recommendations = [];

    libraryMeals.forEach(meal => {
      // Check if meal fits within remaining goals
      if (meal.calories <= remaining.calories * 1.2 && // Allow 20% overage
          meal.protein <= remaining.protein * 1.5) {
        
        const fitScore = this.calculateFitScore(meal, remaining);
        if (fitScore > 0.5) {
          recommendations.push({ ...meal, fitScore });
        }
      }
    });

    return recommendations
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3);
  }

  /**
   * Calculate how well a meal fits remaining nutrition needs
   * @param {Object} meal - Meal object
   * @param {Object} remaining - Remaining nutrition needs
   * @returns {number} Fit score between 0 and 1
   */
  static calculateFitScore(meal, remaining) {
    let score = 0;
    let factors = 0;

    // Calorie fit
    if (remaining.calories > 0) {
      const calorieRatio = meal.calories / remaining.calories;
      score += Math.max(0, 1 - Math.abs(calorieRatio - 0.5)); // Target 50% of remaining
      factors++;
    }

    // Protein fit
    if (remaining.protein > 0) {
      const proteinRatio = meal.protein / remaining.protein;
      score += Math.min(1, proteinRatio);
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }
}

// ===== INITIALIZE MEAL LIBRARY PAGE =====
// Make classes available globally
window.MealLibraryPageManager = MealLibraryPageManager;
window.MealLibraryUtils = MealLibraryUtils;

// Auto-initialize if we're on the meal library page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('meal-library.html')) {
      new MealLibraryPageManager();
    }
  });
} else {
  if (window.location.pathname.includes('meal-library.html')) {
    new MealLibraryPageManager();
  }
}
