/**
 * Progress Page JavaScript
 * Handles progress tracking charts, analytics, and insights
 */

class ProgressManager {
  constructor() {
    this.charts = {};
    this.currentPeriod = 7; // Default to 7 days
    this.init();
  }

  /**
   * Initialize progress tracking functionality
   */
  init() {
    this.setupEventListeners();
    this.loadProgressData();
    this.initializeCharts();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Period selector buttons
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.changePeriod(parseInt(e.target.getAttribute('data-period')));
      });
    });

    // Listen for data refresh events
    document.addEventListener('dataRefresh', () => this.refreshData());
  }

  /**
   * Change tracking period
   * @param {number} days - Number of days to track
   */
  changePeriod(days) {
    this.currentPeriod = days;
    
    // Update active button
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(button => {
      if (parseInt(button.getAttribute('data-period')) === days) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // Refresh data and charts
    this.refreshData();
  }

  /**
   * Load and display progress data
   */
  loadProgressData() {
    this.updateProgressStats();
    this.updateGoalProgress();
    this.generateInsights();
  }

  /**
   * Update progress statistics
   */
  updateProgressStats() {
    const meals = this.getMealsForPeriod();
    const totalDays = this.currentPeriod;
    const daysWithMeals = this.getUniqueDaysWithMeals(meals);
    const avgDays = daysWithMeals.length || 1;

    const totalNutrition = MealManager.calculateTotalNutrition(meals);
    
    // Calculate averages
    const avgNutrition = {
      calories: Math.round(totalNutrition.calories / avgDays),
      protein: Math.round((totalNutrition.protein / avgDays) * 10) / 10,
      carbs: Math.round((totalNutrition.carbs / avgDays) * 10) / 10,
      fats: Math.round((totalNutrition.fats / avgDays) * 10) / 10
    };

    // Update display
    this.updateElement('avg-calories', avgNutrition.calories);
    this.updateElement('avg-protein', `${avgNutrition.protein}g`);
    this.updateElement('avg-carbs', `${avgNutrition.carbs}g`);
    this.updateElement('avg-fats', `${avgNutrition.fats}g`);
  }

  /**
   * Update goal progress bars
   */
  updateGoalProgress() {
    const goals = ProfileManager.getGoals();
    const meals = this.getMealsForPeriod();
    const daysWithMeals = this.getUniqueDaysWithMeals(meals);
    const avgDays = daysWithMeals.length || 1;
    
    const totalNutrition = MealManager.calculateTotalNutrition(meals);
    const avgNutrition = {
      calories: totalNutrition.calories / avgDays,
      protein: totalNutrition.protein / avgDays,
      carbs: totalNutrition.carbs / avgDays,
      fats: totalNutrition.fats / avgDays
    };

    const progressContainer = document.getElementById('goal-progress');
    if (!progressContainer) return;

    const progressBars = [
      { label: 'Calories', current: avgNutrition.calories, goal: goals.calorieGoal, unit: '' },
      { label: 'Protein', current: avgNutrition.protein, goal: goals.proteinGoal, unit: 'g' },
      { label: 'Carbs', current: avgNutrition.carbs, goal: goals.carbsGoal, unit: 'g' },
      { label: 'Fats', current: avgNutrition.fats, goal: goals.fatsGoal, unit: 'g' }
    ];

    progressContainer.innerHTML = progressBars.map(bar => {
      const percentage = bar.goal > 0 ? Math.min((bar.current / bar.goal) * 100, 100) : 0;
      const isOnTrack = percentage >= 80 && percentage <= 120;
      
      return `
        <div class="progress-bar-container">
          <div class="progress-bar-label">
            <span>${bar.label}</span>
            <span>${bar.current.toFixed(1)}${bar.unit} / ${bar.goal}${bar.unit}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${isOnTrack ? 'on-track' : ''}" 
                 style="width: ${percentage}%"></div>
          </div>
          <div class="progress-percentage">${percentage.toFixed(1)}%</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Get meals for current tracking period
   * @returns {Array<Object>} Meals within the period
   */
  getMealsForPeriod() {
    const allMeals = MealManager.getAllMeals();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.currentPeriod + 1);

    return allMeals.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate >= startDate && mealDate <= endDate;
    });
  }

  /**
   * Get unique days that have meals
   * @param {Array<Object>} meals - Array of meals
   * @returns {Array<string>} Array of unique dates
   */
  getUniqueDaysWithMeals(meals) {
    const uniqueDates = [...new Set(meals.map(meal => meal.date))];
    return uniqueDates.sort();
  }

  /**
   * Initialize all charts
   */
  initializeCharts() {
    this.initializeCaloriesTrendChart();
    this.initializeMacrosBreakdownChart();
    this.initializeWeeklyComparisonChart();
  }

  /**
   * Initialize calories trend chart
   */
  initializeCaloriesTrendChart() {
    const ctx = document.getElementById('calories-trend-chart');
    if (!ctx) return;

    const colors = ChartUtils.getChartColors();
    const meals = this.getMealsForPeriod();
    const daysWithMeals = this.getUniqueDaysWithMeals(meals);
    
    // Prepare data for last N days
    const labels = [];
    const caloriesData = [];
    const goalData = [];
    const goals = ProfileManager.getGoals();

    for (let i = this.currentPeriod - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = DateUtils.formatDate(date);
      
      labels.push(DateUtils.getShortDayName(dateString));
      
      const dayMeals = meals.filter(meal => meal.date === dateString);
      const dayCalories = MealManager.calculateTotalNutrition(dayMeals).calories;
      
      caloriesData.push(dayCalories);
      goalData.push(goals.calorieGoal);
    }

    this.charts.caloriesTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Daily Calories',
            data: caloriesData,
            borderColor: colors.primary,
            backgroundColor: colors.primary + '20',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: colors.primary,
            pointBorderColor: colors.background,
            pointBorderWidth: 2,
            pointRadius: 5
          },
          {
            label: 'Goal',
            data: goalData,
            borderColor: colors.error,
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
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
            cornerRadius: 8
          }
        }
      }
    });
  }

  /**
   * Initialize macros breakdown chart
   */
  initializeMacrosBreakdownChart() {
    const ctx = document.getElementById('macros-breakdown-chart');
    if (!ctx) return;

    const colors = ChartUtils.getChartColors();
    const meals = this.getMealsForPeriod();
    const totalNutrition = MealManager.calculateTotalNutrition(meals);

    // Calculate calories from each macro
    const proteinCalories = totalNutrition.protein * 4;
    const carbsCalories = totalNutrition.carbs * 4;
    const fatsCalories = totalNutrition.fats * 9;

    this.charts.macrosBreakdown = new Chart(ctx, {
      type: 'pie',
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
          hoverOffset: 15
        }]
      },
      options: {
        ...ChartUtils.getDefaultOptions(),
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
   * Initialize weekly comparison chart
   */
  initializeWeeklyComparisonChart() {
    const ctx = document.getElementById('weekly-comparison-chart');
    if (!ctx) return;

    const colors = ChartUtils.getChartColors();
    const weeksData = this.getWeeklyComparisonData();

    this.charts.weeklyComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeksData.labels,
        datasets: [
          {
            label: 'Calories',
            data: weeksData.calories,
            backgroundColor: colors.primary + '80',
            borderColor: colors.primary,
            borderWidth: 2,
            borderRadius: 4
          },
          {
            label: 'Protein (×10)',
            data: weeksData.protein.map(p => p * 10), // Scale for visibility
            backgroundColor: colors.secondary + '80',
            borderColor: colors.secondary,
            borderWidth: 2,
            borderRadius: 4
          }
        ]
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
              text: 'Average Daily Values',
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
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 1) {
                  // Protein dataset - divide by 10 to show actual value
                  return `Protein: ${(context.parsed.y / 10).toFixed(1)}g`;
                }
                return `${context.dataset.label}: ${context.parsed.y}`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get weekly comparison data
   * @returns {Object} Weekly comparison data
   */
  getWeeklyComparisonData() {
    const weeks = [];
    const labels = [];
    const calories = [];
    const protein = [];

    // Get data for last 4 weeks
    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekOffset * 7) - weekStart.getDay() + 1);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekMeals = this.getMealsForDateRange(weekStart, weekEnd);
      const weekNutrition = MealManager.calculateTotalNutrition(weekMeals);
      
      // Calculate daily averages
      const daysWithMeals = this.getUniqueDaysWithMeals(weekMeals);
      const avgDays = daysWithMeals.length || 1;
      
      labels.push(`Week ${4 - weekOffset}`);
      calories.push(Math.round(weekNutrition.calories / avgDays));
      protein.push(Math.round((weekNutrition.protein / avgDays) * 10) / 10);
    }

    return { labels, calories, protein };
  }

  /**
   * Get meals for date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array<Object>} Meals in date range
   */
  getMealsForDateRange(startDate, endDate) {
    const allMeals = MealManager.getAllMeals();
    return allMeals.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate >= startDate && mealDate <= endDate;
    });
  }

  /**
   * Update element content with animation
   * @param {string} elementId - Element ID
   * @param {string|number} value - New value
   */
  updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.transform = 'scale(1.05)';
      element.textContent = value;
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    }
  }

  /**
   * Generate and display insights
   */
  generateInsights() {
    const insights = this.analyzeNutritionData();
    const insightsContainer = document.getElementById('insights-grid');
    
    if (!insightsContainer) return;

    if (insights.length === 0) {
      insightsContainer.innerHTML = `
        <div class="insight-card">
          <h4>📊 Getting Started</h4>
          <p>Add more meals to your planner to see personalized insights and recommendations!</p>
        </div>
      `;
      return;
    }

    insightsContainer.innerHTML = insights.map(insight => `
      <div class="insight-card ${insight.type}">
        <h4>${insight.icon} ${insight.title}</h4>
        <p>${insight.message}</p>
      </div>
    `).join('');
  }

  /**
   * Analyze nutrition data and generate insights
   * @returns {Array<Object>} Array of insight objects
   */
  analyzeNutritionData() {
    const meals = this.getMealsForPeriod();
    const goals = ProfileManager.getGoals();
    const insights = [];

    if (meals.length === 0) return insights;

    const totalNutrition = MealManager.calculateTotalNutrition(meals);
    const daysWithMeals = this.getUniqueDaysWithMeals(meals);
    const avgDays = daysWithMeals.length || 1;
    
    const avgNutrition = {
      calories: totalNutrition.calories / avgDays,
      protein: totalNutrition.protein / avgDays,
      carbs: totalNutrition.carbs / avgDays,
      fats: totalNutrition.fats / avgDays
    };

    // Calorie analysis
    const calorieRatio = goals.calorieGoal > 0 ? avgNutrition.calories / goals.calorieGoal : 0;
    if (calorieRatio < 0.8) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Low Calorie Intake',
        message: `You're averaging ${Math.round(avgNutrition.calories)} calories per day, which is ${Math.round((1 - calorieRatio) * 100)}% below your goal. Consider adding more calorie-dense foods.`
      });
    } else if (calorieRatio > 1.2) {
      insights.push({
        type: 'warning',
        icon: '📈',
        title: 'High Calorie Intake',
        message: `You're averaging ${Math.round(avgNutrition.calories)} calories per day, which is ${Math.round((calorieRatio - 1) * 100)}% above your goal. Consider portion control or lower-calorie alternatives.`
      });
    } else {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Great Calorie Balance',
        message: `You're maintaining excellent calorie balance, averaging ${Math.round(avgNutrition.calories)} calories per day!`
      });
    }

    // Protein analysis
    const proteinRatio = goals.proteinGoal > 0 ? avgNutrition.protein / goals.proteinGoal : 0;
    if (proteinRatio < 0.8) {
      insights.push({
        type: 'info',
        icon: '🥩',
        title: 'Increase Protein Intake',
        message: `Consider adding more protein-rich foods like lean meats, fish, eggs, or legumes to reach your daily goal of ${goals.proteinGoal}g.`
      });
    } else if (proteinRatio > 1.5) {
      insights.push({
        type: 'info',
        icon: '⚖️',
        title: 'High Protein Intake',
        message: `You're consuming ${avgNutrition.protein.toFixed(1)}g protein daily. Ensure you're balancing with adequate carbs and fats.`
      });
    }

    // Meal frequency analysis
    const avgMealsPerDay = meals.length / avgDays;
    if (avgMealsPerDay < 3) {
      insights.push({
        type: 'info',
        icon: '🍽️',
        title: 'Meal Frequency',
        message: `You're averaging ${avgMealsPerDay.toFixed(1)} meals per day. Consider adding healthy snacks to maintain energy levels throughout the day.`
      });
    }

    // Macro balance analysis
    const totalMacroCalories = (avgNutrition.protein * 4) + (avgNutrition.carbs * 4) + (avgNutrition.fats * 9);
    if (totalMacroCalories > 0) {
      const proteinPercent = (avgNutrition.protein * 4) / totalMacroCalories * 100;
      const carbsPercent = (avgNutrition.carbs * 4) / totalMacroCalories * 100;
      const fatsPercent = (avgNutrition.fats * 9) / totalMacroCalories * 100;

      if (proteinPercent > 35) {
        insights.push({
          type: 'info',
          icon: '🔄',
          title: 'High Protein Ratio',
          message: `Protein makes up ${proteinPercent.toFixed(1)}% of your calories. Consider balancing with more carbohydrates for energy.`
        });
      }

      if (carbsPercent < 30) {
        insights.push({
          type: 'info',
          icon: '⚡',
          title: 'Low Carbohydrate Intake',
          message: `Carbs make up only ${carbsPercent.toFixed(1)}% of your calories. Consider adding more complex carbs for sustained energy.`
        });
      }
    }

    // Consistency analysis
    const consistentDays = daysWithMeals.length;
    const totalDays = this.currentPeriod;
    const consistencyRatio = consistentDays / totalDays;

    if (consistencyRatio >= 0.8) {
      insights.push({
        type: 'success',
        icon: '🎯',
        title: 'Excellent Consistency',
        message: `You've logged meals for ${consistentDays} out of ${totalDays} days. Keep up the great tracking!`
      });
    } else if (consistencyRatio >= 0.5) {
      insights.push({
        type: 'info',
        icon: '📝',
        title: 'Good Progress',
        message: `You've logged meals for ${consistentDays} out of ${totalDays} days. Try to track meals more consistently for better insights.`
      });
    } else {
      insights.push({
        type: 'warning',
        icon: '📊',
        title: 'Improve Tracking',
        message: `You've only logged meals for ${consistentDays} out of ${totalDays} days. More consistent tracking will provide better insights.`
      });
    }

    return insights;
  }

  /**
   * Update charts with new data
   */
  updateChartsData() {
    // Destroy existing charts and recreate with new data
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    
    this.charts = {};
    this.initializeCharts();
  }

  /**
   * Refresh all progress data
   */
  refreshData() {
    this.loadProgressData();
    this.updateChartsData();
  }

  /**
   * Export progress data as JSON
   * @returns {Object} Progress data object
   */
  exportProgressData() {
    const meals = this.getMealsForPeriod();
    const totalNutrition = MealManager.calculateTotalNutrition(meals);
    const goals = ProfileManager.getGoals();
    const profile = ProfileManager.getProfile();

    return {
      period: this.currentPeriod,
      dateRange: {
        start: DateUtils.formatDate(new Date(Date.now() - (this.currentPeriod - 1) * 24 * 60 * 60 * 1000)),
        end: DateUtils.formatDate(new Date())
      },
      meals: meals.length,
      nutrition: totalNutrition,
      goals,
      profile,
      insights: this.analyzeNutritionData(),
      exportDate: new Date().toISOString()
    };
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

// ===== ADDITIONAL CHART CONFIGURATIONS =====
/**
 * Custom chart configurations for better visual appeal
 */
class ProgressChartConfigs {
  /**
   * Get gradient background for charts
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Base color
   * @returns {CanvasGradient} Gradient object
   */
  static createGradient(ctx, color) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '10');
    return gradient;
  }

  /**
   * Get enhanced chart options for progress charts
   * @returns {Object} Chart options
   */
  static getEnhancedOptions() {
    const colors = ChartUtils.getChartColors();
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          labels: {
            color: colors.text,
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: colors.background,
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.primary,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: {
            size: 14,
            weight: '600'
          },
          bodyFont: {
            size: 13
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: colors.text,
            font: {
              size: 11
            }
          },
          grid: {
            color: colors.grid,
            drawOnChartArea: true,
            drawTicks: false
          }
        },
        y: {
          ticks: {
            color: colors.text,
            font: {
              size: 11
            }
          },
          grid: {
            color: colors.grid,
            drawOnChartArea: true,
            drawTicks: false
          }
        }
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6,
          borderWidth: 2
        },
        line: {
          borderWidth: 3,
          tension: 0.4
        }
      }
    };
  }
}

// ===== PROGRESS ANALYTICS =====
class ProgressAnalytics {
  /**
   * Calculate nutrition trends
   * @param {Array<Object>} meals - Meals data
   * @param {number} days - Number of days to analyze
   * @returns {Object} Trend analysis
   */
  static calculateTrends(meals, days) {
    if (meals.length === 0) return null;

    // Group meals by date
    const mealsByDate = meals.reduce((groups, meal) => {
      if (!groups[meal.date]) {
        groups[meal.date] = [];
      }
      groups[meal.date].push(meal);
      return groups;
    }, {});

    // Calculate daily nutrition values
    const dailyNutrition = Object.keys(mealsByDate).map(date => {
      const dayMeals = mealsByDate[date];
      return {
        date,
        ...MealManager.calculateTotalNutrition(dayMeals)
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (dailyNutrition.length < 2) return null;

    // Calculate trends (simple linear regression)
    const trends = {};
    ['calories', 'protein', 'carbs', 'fats'].forEach(nutrient => {
      const values = dailyNutrition.map(day => day[nutrient]);
      const trend = this.calculateLinearTrend(values);
      trends[nutrient] = trend;
    });

    return trends;
  }

  /**
   * Calculate linear trend for data series
   * @param {Array<number>} values - Data values
   * @returns {Object} Trend object with slope and direction
   */
  static calculateLinearTrend(values) {
    if (values.length < 2) return { slope: 0, direction: 'stable' };

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let direction = 'stable';
    if (slope > 0.1) direction = 'increasing';
    else if (slope < -0.1) direction = 'decreasing';

    return { slope, direction };
  }

  /**
   * Calculate streak information
   * @param {Array<Object>} meals - Meals data
   * @returns {Object} Streak information
   */
  static calculateStreaks(meals) {
    if (meals.length === 0) return { current: 0, longest: 0 };

    const uniqueDates = this.getUniqueDates(meals).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = DateUtils.formatDate(new Date());
    const yesterday = DateUtils.formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    // Check if today or yesterday has meals (for current streak)
    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      currentStreak = 1;
      
      // Count backwards from today/yesterday
      let checkDate = uniqueDates.includes(today) ? today : yesterday;
      let checkIndex = uniqueDates.indexOf(checkDate);
      
      while (checkIndex > 0) {
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateString = DateUtils.formatDate(prevDate);
        
        if (uniqueDates.includes(prevDateString)) {
          currentStreak++;
          checkDate = prevDateString;
          checkIndex = uniqueDates.indexOf(checkDate);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const prevDate = new Date(uniqueDates[i - 1]);
      const dayDiff = (currentDate - prevDate) / (24 * 60 * 60 * 1000);
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Get unique dates from meals
   * @param {Array<Object>} meals - Meals array
   * @returns {Array<string>} Unique dates
   */
  static getUniqueDates(meals) {
    return [...new Set(meals.map(meal => meal.date))];
  }
}

// ===== INITIALIZE PROGRESS MANAGER =====
// Make ProgressManager available globally
window.ProgressManager = ProgressManager;
window.ProgressAnalytics = ProgressAnalytics;

// Auto-initialize if we're on the progress page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('progress.html')) {
      new ProgressManager();
    }
  });
} else {
  if (window.location.pathname.includes('progress.html')) {
    new ProgressManager();
  }
}
