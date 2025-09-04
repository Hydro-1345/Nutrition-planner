/**
 * Dashboard Page JavaScript
 * Handles dashboard functionality including charts, stats, and recent meals display
 */

class DashboardManager {
  constructor() {
    this.charts = {};
    this.init();
  }

  /**
   * Initialize dashboard functionality
   */
  init() {
    this.loadDashboardData();
    this.initializeCharts();
    this.setupEventListeners();
    this.refreshData();
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
    this.initializeWeeklyCaloriesChart();
    this.initializeMacrosChart();
  }

  /**
   * Initialize weekly calories chart
   */
  initializeWeeklyCaloriesChart() {
    const ctx = document.getElementById('weekly-calories-chart');
    if (!ctx) return;

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
   * Initialize macros distribution chart
   */
  initializeMacrosChart() {
    const ctx = document.getElementById('macros-chart');
    if (!ctx) return;

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
  }

  /**
   * Refresh all dashboard data
   */
  refreshData() {
    this.loadDashboardData();
  }

  /**
   * Destroy charts when leaving page
   */
  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
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
