/**
 * Dashboard Page JavaScript
 * Handles dashboard functionality including charts, stats, and recent meals display
 */

class DashboardManager {
  constructor() {
    this.charts = {};
    this.userData = {};
    this.init();
  }

  /**
   * Initialize dashboard functionality
   */
  init() {
    try {
      this.loadUserData();
      this.loadDashboardData();
      this.initializeCharts();
      this.setupEventListeners();
      this.refreshData();
    } catch (error) {
      this.showErrorMessage('Oops! Something went wrong loading your dashboard. Please try again.');
      console.error('Dashboard initialization error:', error);
    }
  }

  /**
   * Show error message to user
   * @param {string} message - Error message to display
   */
  showErrorMessage(message) {
    const dashboardContainer = document.querySelector('.dashboard-container') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>Dashboard Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="btn btn-primary">Try Again</button>
      </div>
    `;
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
      z-index: 1000;
      max-width: 400px;
    `;
    dashboardContainer.appendChild(errorDiv);
  }

  /**
   * Setup event listeners for dashboard
   */
  setupEventListeners() {
    // Listen for data refresh events
    document.addEventListener('dataRefresh', () => this.refreshData());
    
    // Refresh data when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.refreshData();
      }
    });
  }

  /**
   * Load user data from localStorage
   */
  loadUserData() {
    try {
      this.userData = {
        height: parseFloat(localStorage.getItem('userHeight')) || 0,
        weight: parseFloat(localStorage.getItem('userWeight')) || 0,
        age: parseInt(localStorage.getItem('userAge')) || 0,
        gender: localStorage.getItem('userGender') || 'not-specified',
        activityLevel: localStorage.getItem('userActivityLevel') || 'moderate',
        goal: localStorage.getItem('userGoal') || 'maintain'
      };
      
      // Calculate derived metrics
      this.userData.bmi = this.calculateBMI();
      this.userData.bmiCategory = this.getBMICategory();
      this.userData.bmr = this.calculateBMR();
      this.userData.tdee = this.calculateTDEE();
      
      this.updateUserMetrics();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  /**
   * Calculate BMI
   * @returns {number} BMI value
   */
  calculateBMI() {
    if (this.userData.height <= 0 || this.userData.weight <= 0) return 0;
    
    // Convert height from cm to meters
    const heightInMeters = this.userData.height / 100;
    return this.userData.weight / (heightInMeters * heightInMeters);
  }

  /**
   * Get BMI category
   * @returns {string} BMI category
   */
  getBMICategory() {
    const bmi = this.userData.bmi;
    if (bmi === 0) return 'Not available';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  /**
   * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
   * @returns {number} BMR in calories
   */
  calculateBMR() {
    if (this.userData.weight <= 0 || this.userData.height <= 0 || this.userData.age <= 0) return 0;
    
    let bmr = 10 * this.userData.weight + 6.25 * this.userData.height - 5 * this.userData.age;
    
    if (this.userData.gender === 'male') {
      bmr += 5;
    } else if (this.userData.gender === 'female') {
      bmr -= 161;
    }
    
    return Math.round(bmr);
  }

  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   * @returns {number} TDEE in calories
   */
  calculateTDEE() {
    const bmr = this.userData.bmr;
    if (bmr === 0) return 0;
    
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very-active': 1.9
    };
    
    const multiplier = activityMultipliers[this.userData.activityLevel] || 1.55;
    return Math.round(bmr * multiplier);
  }

  /**
   * Update user metrics display
   */
  updateUserMetrics() {
    // Update BMI display
    this.updateMetricDisplay('bmi-value', this.userData.bmi > 0 ? this.userData.bmi.toFixed(1) : 'N/A');
    this.updateMetricDisplay('bmi-category', this.userData.bmiCategory);
    
    // Update BMR display
    this.updateMetricDisplay('bmr-value', this.userData.bmr > 0 ? this.userData.bmr + ' cal' : 'N/A');
    
    // Update TDEE display
    this.updateMetricDisplay('tdee-value', this.userData.tdee > 0 ? this.userData.tdee + ' cal' : 'N/A');
    
    // Update user info display
    this.updateMetricDisplay('user-height', this.userData.height > 0 ? this.userData.height + ' cm' : 'Not set');
    this.updateMetricDisplay('user-weight', this.userData.weight > 0 ? this.userData.weight + ' kg' : 'Not set');
    this.updateMetricDisplay('user-age', this.userData.age > 0 ? this.userData.age + ' years' : 'Not set');
    
    // Update BMI color coding
    this.updateBMIColor();
  }

  /**
   * Update individual metric display
   * @param {string} elementId - Element ID
   * @param {string} value - Value to display
   */
  updateMetricDisplay(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
      
      // Add animation for value change
      element.style.transform = 'scale(1.05)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    }
  }

  /**
   * Update BMI color coding based on category
   */
  updateBMIColor() {
    const bmiElement = document.getElementById('bmi-value');
    const categoryElement = document.getElementById('bmi-category');
    
    if (!bmiElement || !categoryElement) return;
    
    const bmi = this.userData.bmi;
    let color = '#6c757d'; // Default gray
    
    if (bmi > 0) {
      if (bmi < 18.5) {
        color = '#17a2b8'; // Blue for underweight
      } else if (bmi < 25) {
        color = '#28a745'; // Green for normal
      } else if (bmi < 30) {
        color = '#ffc107'; // Yellow for overweight
      } else {
        color = '#dc3545'; // Red for obese
      }
    }
    
    bmiElement.style.color = color;
    categoryElement.style.color = color;
  }

  /**
   * Load and display dashboard data
   */
  loadDashboardData() {
    this.updateWeeklyStats();
    this.updateRecentMeals();
  }

  /**
   * Update weekly nutrition statistics
   */
  updateWeeklyStats() {
    const weekMeals = MealManager.getWeekMeals();
    const totalNutrition = MealManager.calculateTotalNutrition(weekMeals);

    // Update stat cards
    this.updateStatCard('total-calories', totalNutrition.calories);
    this.updateStatCard('total-protein', `${totalNutrition.protein.toFixed(1)}g`);
    this.updateStatCard('total-carbs', `${totalNutrition.carbs.toFixed(1)}g`);
    this.updateStatCard('total-fats', `${totalNutrition.fats.toFixed(1)}g`);

    // Update charts with new data
    this.updateChartsData(weekMeals, totalNutrition);
  }

  /**
   * Update individual stat card
   * @param {string} elementId - Element ID
   * @param {string|number} value - Value to display
   */
  updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
      
      // Add animation for value change
      element.style.transform = 'scale(1.1)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    }
  }

  /**
   * Update recent meals display
   */
  updateRecentMeals() {
    const recentMealsContainer = document.getElementById('recent-meals-list');
    if (!recentMealsContainer) return;

    const allMeals = MealManager.getAllMeals();
    const recentMeals = allMeals
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(0, 5);

    if (recentMeals.length === 0) {
      recentMealsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <h4>No meals yet</h4>
          <p>Start by adding your first meal!</p>
          <a href="meal-planner.html" class="btn btn-primary">Add Meal</a>
        </div>
      `;
      return;
    }

    recentMealsContainer.innerHTML = recentMeals.map(meal => `
      <div class="meal-card interactive-card">
        <div class="meal-header">
          <div class="meal-info">
            <h4>${ValidationUtils.sanitizeHTML(meal.foodItem)}</h4>
            <div class="meal-meta">
              <span class="meal-type-badge">${meal.mealType}</span>
              <span class="date-display">${DateUtils.formatDisplayDate(meal.date)}</span>
            </div>
          </div>
          <div class="calorie-badge">
            <span>🔥</span>
            <span>${meal.calories} cal</span>
          </div>
        </div>
        <div class="meal-nutrition">
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
    `).join('');

    // Add staggered animation to meal cards
    const mealCards = recentMealsContainer.querySelectorAll('.meal-card');
    AnimationUtils.staggerFadeIn(mealCards, 100);
  }

  /**
   * Initialize Chart.js charts
   */
  initializeCharts() {
    try {
      this.renderWeeklyCaloriesChart();
      this.renderMacrosChart();
    } catch (error) {
      this.showErrorMessage('Oops! Something went wrong loading your charts. Please try again.');
      console.error('Chart initialization error:', error);
    }
  }

  /**
   * Render weekly calories chart
   */
  renderWeeklyCaloriesChart() {
    const ctx = document.getElementById('weekly-calories-chart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.charts.weeklyCalories) {
      this.charts.weeklyCalories.destroy();
    }

    const colors = ChartUtils.getChartColors();
    const weekDates = DateUtils.getWeekDates();
    const weekMeals = MealManager.getWeekMeals();

    // Calculate daily calories for each day of the week
    const dailyCalories = weekDates.map(date => {
      const dayMeals = weekMeals.filter(meal => meal.date === date);
      return MealManager.calculateTotalNutrition(dayMeals).calories;
    });

    const labels = weekDates.map(date => DateUtils.getShortDayName(date));

    this.charts.weeklyCalories = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Calories',
          data: dailyCalories,
          borderColor: colors.primary,
          backgroundColor: colors.primary + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary,
          pointBorderColor: colors.background,
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        ...ChartUtils.getDefaultOptions(),
        scales: {
          ...ChartUtils.getDefaultOptions().scales,
          y: {
            ...ChartUtils.getDefaultOptions().scales.y,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Calories',
              color: colors.text
            }
          }
        },
        plugins: {
          ...ChartUtils.getDefaultOptions().plugins,
          tooltip: {
            backgroundColor: colors.background,
            titleColor: colors.text,
            bodyColor: colors.text,
            borderColor: colors.primary,
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false
          }
        }
      }
    });
  }

  /**
   * Render macros distribution chart
   */
  renderMacrosChart() {
    const ctx = document.getElementById('macros-chart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.charts.macros) {
      this.charts.macros.destroy();
    }

    const colors = ChartUtils.getChartColors();
    const weekMeals = MealManager.getWeekMeals();
    const totalNutrition = MealManager.calculateTotalNutrition(weekMeals);

    // Calculate calories from each macro
    const proteinCalories = totalNutrition.protein * 4;
    const carbsCalories = totalNutrition.carbs * 4;
    const fatsCalories = totalNutrition.fats * 9;

    this.charts.macros = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Protein', 'Carbohydrates', 'Fats'],
        datasets: [{
          data: [proteinCalories, carbsCalories, fatsCalories],
          backgroundColor: [
            colors.primary,
            colors.secondary,
            colors.warning
          ],
          borderColor: colors.background,
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        ...ChartUtils.getDefaultOptions(),
        cutout: '60%',
        plugins: {
          ...ChartUtils.getDefaultOptions().plugins,
          legend: {
            ...ChartUtils.getDefaultOptions().plugins.legend,
            position: 'bottom'
          },
          tooltip: {
            backgroundColor: colors.background,
            titleColor: colors.text,
            bodyColor: colors.text,
            borderColor: colors.primary,
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const label = context.label;
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} cal (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Update charts with new data
   * @param {Array<Object>} weekMeals - Week meals data
   * @param {Object} totalNutrition - Total nutrition data
   */
  updateChartsData(weekMeals, totalNutrition) {
    try {
      // Update weekly calories chart
      if (this.charts.weeklyCalories) {
        const weekDates = DateUtils.getWeekDates();
        const dailyCalories = weekDates.map(date => {
          const dayMeals = weekMeals.filter(meal => meal.date === date);
          return MealManager.calculateTotalNutrition(dayMeals).calories;
        });

        this.charts.weeklyCalories.data.datasets[0].data = dailyCalories;
        this.charts.weeklyCalories.update('active');
      }

      // Update macros chart
      if (this.charts.macros) {
        const proteinCalories = totalNutrition.protein * 4;
        const carbsCalories = totalNutrition.carbs * 4;
        const fatsCalories = totalNutrition.fats * 9;

        this.charts.macros.data.datasets[0].data = [proteinCalories, carbsCalories, fatsCalories];
        this.charts.macros.update('active');
      }
    } catch (error) {
      console.error('Error updating charts:', error);
    }
  }

  /**
   * Refresh all dashboard data
   */
  refreshData() {
    try {
      this.loadDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  }

  /**
   * Destroy charts when leaving page
   */
  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (error) {
          console.error('Error destroying chart:', error);
        }
      }
    });
    this.charts = {};
  }
}

// ===== INITIALIZE DASHBOARD =====
// Make DashboardManager available globally
window.DashboardManager = DashboardManager;

// Auto-initialize if we're on the dashboard page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('dashboard')) {
      new DashboardManager();
    }
  });
} else {
  if (window.location.pathname.includes('dashboard.html') || 
      window.location.pathname === '/' || 
      window.location.pathname.endsWith('dashboard')) {
    new DashboardManager();
  }
}
