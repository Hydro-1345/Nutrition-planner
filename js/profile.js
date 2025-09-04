/**
 * Profile Page JavaScript
 * Handles profile management, goals setting, and BMI calculation
 */

class ProfilePageManager {
  constructor() {
    this.init();
  }

  /**
   * Initialize profile page functionality
   */
  init() {
    this.loadProfileData();
    this.setupEventListeners();
    this.calculateBMI();
  }

  /**
   * Load profile data into forms
   */
  loadProfileData() {
    const profile = ProfileManager.getProfile();
    const goals = ProfileManager.getGoals();

    // Populate profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      FormUtils.populateForm(profileForm, profile);
    }

    // Populate goals form
    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) {
      FormUtils.populateForm(goalsForm, goals);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Profile form changes
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('input', () => this.handleProfileChange());
    }

    // Goals form changes
    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) {
      goalsForm.addEventListener('input', () => this.handleGoalsChange());
    }

    // Save profile button - CRITICAL: Ensure click listener is properly set up
    const saveBtn = document.getElementById('save-profile');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission if button is in a form
        this.saveProfile();
      });
    } else {
      console.error('Save profile button not found!');
    }

    // Reset profile button
    const resetBtn = document.getElementById('reset-profile');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetProfile());
    }

    // Auto-calculate goals button
    const autoCalcBtn = document.getElementById('auto-calculate-btn');
    if (autoCalcBtn) {
      autoCalcBtn.addEventListener('click', () => this.autoCalculateGoals());
    }

    // BMI calculation on height/weight change
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    if (heightInput && weightInput) {
      [heightInput, weightInput].forEach(input => {
        input.addEventListener('input', () => this.calculateBMI());
      });
    }
  }

  /**
   * Handle profile form changes
   */
  handleProfileChange() {
    this.calculateBMI();
  }

  /**
   * Handle goals form changes
   */
  handleGoalsChange() {
    // Auto-save goals on change (optional)
    // this.saveGoals();
  }

  /**
   * Save profile and goals - CRITICAL: Main save functionality
   */
  saveProfile() {
    console.log('Save profile triggered'); // Debug log
    
    const profileForm = document.getElementById('profile-form');
    const goalsForm = document.getElementById('goals-form');
    
    if (!profileForm || !goalsForm) {
      console.error('Profile or goals form not found!');
      alert('Error: Forms not found. Please refresh the page.');
      return;
    }

    // CRITICAL: Retrieve ALL input fields from forms
    const profileData = this.getAllFormData(profileForm);
    const goalsData = this.getAllFormData(goalsForm);

    console.log('Profile data retrieved:', profileData); // Debug log
    console.log('Goals data retrieved:', goalsData); // Debug log

    // Validate profile data
    const profileValidation = this.validateProfileData(profileData);
    if (!profileValidation.isValid) {
      FormUtils.showErrors(profileForm, profileValidation.errors);
      alert('Please fix the following errors:\n' + profileValidation.errors.join('\n'));
      return;
    }

    // Validate goals data
    const goalsValidation = this.validateGoalsData(goalsData);
    if (!goalsValidation.isValid) {
      FormUtils.showErrors(goalsForm, goalsValidation.errors);
      alert('Please fix the following errors:\n' + goalsValidation.errors.join('\n'));
      return;
    }

    // Calculate and save BMI data
    this.calculateAndSaveBMI(profileData);

    // CRITICAL: Save data to localStorage
    const profileSuccess = ProfileManager.saveProfile(profileData);
    const goalsSuccess = ProfileManager.saveGoals(goalsData);

    if (profileSuccess && goalsSuccess) {
      // CRITICAL: Show confirmation alert
      alert('Profile saved successfully!');
      
      // Also show notification if available
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showSuccess('Profile saved successfully!');
      }
      
      this.showSuccessMessage();
      
      // Trigger data refresh for other pages
      document.dispatchEvent(new CustomEvent('dataRefresh'));
      
      // Update BMI display on dashboard if available
      this.updateDashboardBMI();
    } else {
      alert('Failed to save profile. Please try again.');
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showError('Failed to save profile. Please try again.');
      }
    }
  }

  /**
   * CRITICAL: Get ALL form data from input fields
   * @param {HTMLElement} form - The form element
   * @returns {Object} Form data object
   */
  getAllFormData(form) {
    const formData = {};
    
    // Get all input elements
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const name = input.name || input.id;
      if (name) {
        if (input.type === 'checkbox') {
          formData[name] = input.checked;
        } else if (input.type === 'radio') {
          if (input.checked) {
            formData[name] = input.value;
          }
        } else {
          formData[name] = input.value;
        }
      }
    });
    
    return formData;
  }

  /**
   * Calculate and save BMI to localStorage
   * @param {Object} profileData - Profile data containing height and weight
   */
  calculateAndSaveBMI(profileData) {
    const height = parseFloat(profileData.height);
    const weight = parseFloat(profileData.weight);

    if (height && weight) {
      const bmi = ProfileManager.calculateBMI(height, weight);
      const bmiCategory = ProfileManager.getBMICategory(bmi);
      
      // Save BMI data to localStorage
      const bmiData = {
        value: bmi,
        category: bmiCategory,
        height: height,
        weight: weight,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('userBMI', JSON.stringify(bmiData));
      console.log('BMI data saved to localStorage:', bmiData); // Debug log
    }
  }

  /**
   * Update BMI display on dashboard
   */
  updateDashboardBMI() {
    const bmiData = this.getBMIData();
    if (!bmiData) return;

    // Update dashboard BMI elements if they exist
    const dashboardBMIValue = document.getElementById('dashboard-bmi-value');
    const dashboardBMICategory = document.getElementById('dashboard-bmi-category');
    
    if (dashboardBMIValue) {
      dashboardBMIValue.textContent = bmiData.value.toFixed(1);
    }
    
    if (dashboardBMICategory) {
      dashboardBMICategory.textContent = bmiData.category;
      dashboardBMICategory.className = `bmi-category ${this.getBMICategoryClass(bmiData.value)}`;
    }

    // Dispatch custom event for other components to listen to
    document.dispatchEvent(new CustomEvent('bmiUpdated', {
      detail: bmiData
    }));
  }

  /**
   * Get BMI data from localStorage
   * @returns {Object|null} BMI data object or null if not found
   */
  getBMIData() {
    const bmiData = localStorage.getItem('userBMI');
    return bmiData ? JSON.parse(bmiData) : null;
  }

  /**
   * Reset profile to defaults
   */
  resetProfile() {
    if (confirm('Are you sure you want to reset your profile to defaults? This cannot be undone.')) {
      const profileForm = document.getElementById('profile-form');
      const goalsForm = document.getElementById('goals-form');
      
      if (profileForm) {
        FormUtils.resetForm(profileForm);
        FormUtils.populateForm(profileForm, APP_CONFIG.defaults.profile);
      }
      
      if (goalsForm) {
        FormUtils.resetForm(goalsForm);
        FormUtils.populateForm(goalsForm, APP_CONFIG.defaults.goals);
      }

      this.calculateBMI();
      
      // Clear BMI data from localStorage
      localStorage.removeItem('userBMI');
      
      NotificationManager.showInfo('Profile reset to defaults');
    }
  }

  /**
   * Auto-calculate nutrition goals based on profile
   */
  autoCalculateGoals() {
    const profileForm = document.getElementById('profile-form');
    if (!profileForm) return;

    const profileData = FormUtils.getFormData(profileForm);
    
    // Validate required fields for calculation
    const requiredFields = ['age', 'gender', 'height', 'weight', 'activityLevel', 'goal'];
    const validation = ValidationUtils.validateRequired(profileData, requiredFields);
    
    if (!validation.isValid) {
      NotificationManager.showError('Please fill in all profile information to auto-calculate goals');
      return;
    }

    // Calculate daily calories
    const dailyCalories = ProfileManager.calculateDailyCalories(profileData);
    if (!dailyCalories) {
      NotificationManager.showError('Unable to calculate goals with current profile data');
      return;
    }

    // Calculate macro goals
    const macroGoals = ProfileManager.calculateMacroGoals(dailyCalories, profileData.goal);
    if (!macroGoals) {
      NotificationManager.showError('Unable to calculate macro goals');
      return;
    }

    // Update goals form
    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) {
      const calculatedGoals = {
        calorieGoal: dailyCalories,
        proteinGoal: macroGoals.protein,
        carbsGoal: macroGoals.carbs,
        fatsGoal: macroGoals.fats
      };
      
      FormUtils.populateForm(goalsForm, calculatedGoals);
      NotificationManager.showSuccess('Goals calculated based on your profile!');
    }
  }

  /**
   * Calculate and display BMI
   */
  calculateBMI() {
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const bmiValueElement = document.getElementById('bmi-value');
    const bmiCategoryElement = document.getElementById('bmi-category');

    if (!heightInput || !weightInput || !bmiValueElement || !bmiCategoryElement) return;

    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);

    if (!height || !weight) {
      bmiValueElement.textContent = '--';
      bmiCategoryElement.textContent = 'Enter height and weight';
      bmiCategoryElement.className = 'bmi-category';
      return;
    }

    const bmi = ProfileManager.calculateBMI(height, weight);
    const category = ProfileManager.getBMICategory(bmi);

    bmiValueElement.textContent = bmi.toFixed(1);
    bmiCategoryElement.textContent = category;
    
    // Add category-specific styling
    bmiCategoryElement.className = `bmi-category ${this.getBMICategoryClass(bmi)}`;
  }

  /**
   * Get CSS class for BMI category
   * @param {number} bmi - BMI value
   * @returns {string} CSS class name
   */
  getBMICategoryClass(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  /**
   * Validate profile data
   * @param {Object} profileData - Profile data object
   * @returns {Object} Validation result
   */
  validateProfileData(profileData) {
    const errors = [];

    // Age validation
    if (profileData.age && !ValidationUtils.isValidNumber(profileData.age, 13, 120)) {
      errors.push('Age must be between 13 and 120 years');
    }

    // Height validation
    if (profileData.height && !ValidationUtils.isValidNumber(profileData.height, 100, 250)) {
      errors.push('Height must be between 100 and 250 cm');
    }

    // Weight validation
    if (profileData.weight && !ValidationUtils.isValidNumber(profileData.weight, 30, 300)) {
      errors.push('Weight must be between 30 and 300 kg');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate goals data
   * @param {Object} goalsData - Goals data object
   * @returns {Object} Validation result
   */
  validateGoalsData(goalsData) {
    const errors = [];

    // Calorie goal validation
    if (goalsData.calorieGoal && !ValidationUtils.isValidNumber(goalsData.calorieGoal, 1000, 5000)) {
      errors.push('Daily calories must be between 1000 and 5000');
    }

    // Protein goal validation
    if (goalsData.proteinGoal && !ValidationUtils.isValidNumber(goalsData.proteinGoal, 0, 500)) {
      errors.push('Protein goal must be between 0 and 500g');
    }

    // Carbs goal validation
    if (goalsData.carbsGoal && !ValidationUtils.isValidNumber(goalsData.carbsGoal, 0, 1000)) {
      errors.push('Carbohydrates goal must be between 0 and 1000g');
    }

    // Fats goal validation
    if (goalsData.fatsGoal && !ValidationUtils.isValidNumber(goalsData.fatsGoal, 0, 300)) {
      errors.push('Fats goal must be between 0 and 300g');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
      successMessage.style.display = 'flex';
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Get profile completion percentage
   * @returns {number} Completion percentage
   */
  getProfileCompletion() {
    const profile = ProfileManager.getProfile();
    const goals = ProfileManager.getGoals();
    
    const profileFields = ['firstName', 'lastName', 'age', 'gender', 'height', 'weight', 'activityLevel', 'goal'];
    const goalFields = ['calorieGoal', 'proteinGoal', 'carbsGoal', 'fatsGoal'];
    
    const totalFields = profileFields.length + goalFields.length;
    let completedFields = 0;

    profileFields.forEach(field => {
      if (profile[field] && profile[field] !== '') {
        completedFields++;
      }
    });

    goalFields.forEach(field => {
      if (goals[field] && goals[field] > 0) {
        completedFields++;
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Generate profile summary
   * @returns {Object} Profile summary object
   */
  generateProfileSummary() {
    const profile = ProfileManager.getProfile();
    const goals = ProfileManager.getGoals();
    
    const summary = {
      profile,
      goals,
      completion: this.getProfileCompletion(),
      bmi: null,
      bmiCategory: null,
      dailyCalorieNeeds: null
    };

    // Get BMI from localStorage if available
    const bmiData = this.getBMIData();
    if (bmiData) {
      summary.bmi = bmiData.value;
      summary.bmiCategory = bmiData.category;
    } else if (profile.height && profile.weight) {
      // Fallback to calculating from profile data
      summary.bmi = ProfileManager.calculateBMI(profile.height, profile.weight);
      summary.bmiCategory = ProfileManager.getBMICategory(summary.bmi);
    }

    // Calculate daily calorie needs if profile complete
    if (profile.age && profile.gender && profile.height && profile.weight && profile.activityLevel) {
      summary.dailyCalorieNeeds = ProfileManager.calculateDailyCalories(profile);
    }

    return summary;
  }
}

// ===== PROFILE UTILITIES =====
class ProfileUtils {
  /**
   * Generate personalized recommendations based on profile
   * @param {Object} profile - User profile
   * @param {Object} goals - User goals
   * @returns {Array<string>} Array of recommendations
   */
  static generateRecommendations(profile, goals) {
    const recommendations = [];

    // BMI-based recommendations
    if (profile.height && profile.weight) {
      const bmi = ProfileManager.calculateBMI(profile.height, profile.weight);
      const category = ProfileManager.getBMICategory(bmi);

      switch (category) {
        case 'Underweight':
          recommendations.push('Consider increasing calorie intake with nutrient-dense foods');
          recommendations.push('Focus on protein-rich foods to support healthy weight gain');
          break;
        case 'Overweight':
          recommendations.push('Consider a moderate calorie deficit for gradual weight loss');
          recommendations.push('Increase fiber intake with vegetables and whole grains');
          break;
        case 'Obese':
          recommendations.push('Consult with a healthcare provider for a personalized plan');
          recommendations.push('Focus on portion control and regular meal timing');
          break;
      }
    }

    // Goal-based recommendations
    switch (profile.goal) {
      case 'lose-weight':
        recommendations.push('Create a moderate calorie deficit (300-500 calories below maintenance)');
        recommendations.push('Prioritize protein to preserve muscle mass during weight loss');
        break;
      case 'gain-weight':
        recommendations.push('Aim for a calorie surplus of 300-500 calories above maintenance');
        recommendations.push('Include healthy fats like nuts, avocado, and olive oil');
        break;
      case 'build-muscle':
        recommendations.push('Consume 1.6-2.2g protein per kg body weight');
        recommendations.push('Time protein intake around workouts for optimal recovery');
        break;
      case 'improve-performance':
        recommendations.push('Focus on carbohydrate timing around training sessions');
        recommendations.push('Ensure adequate hydration and electrolyte balance');
        break;
    }

    // Activity level recommendations
    switch (profile.activityLevel) {
      case 'sedentary':
        recommendations.push('Consider adding light physical activity to your routine');
        break;
      case 'very-active':
        recommendations.push('Ensure adequate carbohydrate intake to fuel intense training');
        recommendations.push('Consider post-workout nutrition for optimal recovery');
        break;
    }

    return recommendations;
  }

  /**
   * Calculate ideal weight range based on height
   * @param {number} height - Height in cm
   * @returns {Object} Weight range object
   */
  static calculateIdealWeightRange(height) {
    if (!height) return null;

    const heightInMeters = height / 100;
    const minWeight = 18.5 * heightInMeters * heightInMeters;
    const maxWeight = 24.9 * heightInMeters * heightInMeters;

    return {
      min: Math.round(minWeight * 10) / 10,
      max: Math.round(maxWeight * 10) / 10
    };
  }

  /**
   * Load and display BMI on dashboard
   * @param {string} bmiValueId - ID of BMI value element
   * @param {string} bmiCategoryId - ID of BMI category element
   */
  static loadDashboardBMI(bmiValueId = 'dashboard-bmi-value', bmiCategoryId = 'dashboard-bmi-category') {
    const bmiData = localStorage.getItem('userBMI');
    if (!bmiData) return;

    try {
      const bmi = JSON.parse(bmiData);
      
      const bmiValueElement = document.getElementById(bmiValueId);
      const bmiCategoryElement = document.getElementById(bmiCategoryId);
      
      if (bmiValueElement) {
        bmiValueElement.textContent = bmi.value.toFixed(1);
      }
      
      if (bmiCategoryElement) {
        bmiCategoryElement.textContent = bmi.category;
        bmiCategoryElement.className = `bmi-category ${this.getBMICategoryClass(bmi.value)}`;
      }
    } catch (error) {
      console.error('Error loading BMI data:', error);
    }
  }

  /**
   * Get CSS class for BMI category
   * @param {number} bmi - BMI value
   * @returns {string} CSS class name
   */
  static getBMICategoryClass(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }
}

// Make classes available globally
window.ProfilePageManager = ProfilePageManager;
window.ProfileUtils = ProfileUtils;
