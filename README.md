# 🥗 Nutrition & Meal Planner

A comprehensive web application for planning daily and weekly meals based on nutrition goals. Perfect for athletes and health-conscious individuals who want to track calories, protein, carbs, and other macronutrients.

## ✨ Features

### Core Functionality
- **📊 Smart Dashboard** - Weekly nutrition overview with interactive charts
- **🍽️ Meal Planning** - Add meals by date and type with detailed nutrition info
- **📈 Progress Tracking** - Visualize nutrition trends and goal achievement
- **📚 Meal Library** - Save and reuse favorite meals for quick planning
- **👤 Profile Management** - Set personal goals based on weight, height, and fitness objectives
- **🌙 Dark/Light Mode** - Toggle between themes for comfortable viewing

### Technical Features
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Offline Storage** - All data saved locally using browser LocalStorage
- **Interactive Charts** - Beautiful data visualizations using Chart.js
- **Accessibility** - WCAG compliant with keyboard navigation and screen reader support
- **SEO Optimized** - Proper meta tags, semantic HTML, and Open Graph support

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js for data visualization
- **Storage**: Browser LocalStorage for data persistence
- **Fonts**: Inter font family from Google Fonts
- **Icons**: Unicode emojis for lightweight, accessible icons

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation
1. Download or clone this repository
2. Open `index.html` in your web browser
3. Start planning your meals!

### Deployment Options

#### Static Hosting (Recommended)
- **Netlify**: Drag and drop the project folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Upload to a GitHub repository and enable Pages
- **Surge.sh**: Use `surge` command after installing surge CLI

#### Local Development
```bash
# Option 1: Python (if installed)
python -m http.server 8000

# Option 2: Node.js (if installed)
npx serve .

# Option 3: PHP (if installed)
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 📱 Usage Guide

### Getting Started
1. **Set Up Profile** - Visit the Profile page to enter your personal information
2. **Set Goals** - Define your daily nutrition targets (calories, protein, carbs, fats)
3. **Plan Meals** - Use the Meal Planner to add meals for any date
4. **Track Progress** - Monitor your nutrition trends on the Progress page
5. **Build Library** - Save frequently eaten meals to your personal library

### Key Features Explained

#### Dashboard
- View weekly nutrition summary
- See recent meals and quick stats
- Access quick actions for common tasks

#### Meal Planner
- Add meals with detailed nutrition information
- View today's planned meals
- See weekly meal overview
- Auto-calculate calories from macronutrients

#### Progress Tracking
- Choose tracking periods (7, 14, or 30 days)
- View calories trend and macro distribution charts
- Get personalized insights and recommendations
- Monitor goal achievement with progress bars

#### Meal Library
- Browse saved meals with search and filtering
- Quick-add meals to your daily plan
- Manage your personal meal collection
- Pre-loaded with popular healthy meals

#### Profile Settings
- Manage personal information
- Set and adjust nutrition goals
- Auto-calculate goals based on your profile
- BMI calculator with health categories

## 🎨 Design Philosophy

### User Experience
- **Clean & Modern** - Minimalist design focused on functionality
- **Intuitive Navigation** - Clear information hierarchy and logical flow
- **Responsive Layout** - Optimized for all screen sizes
- **Accessibility First** - Keyboard navigation, screen reader support, and WCAG compliance

### Visual Design
- **Consistent Color Palette** - Professional green and blue theme
- **Typography** - Inter font for excellent readability
- **Smooth Animations** - Subtle transitions and hover effects
- **Dark Mode Support** - Automatic theme switching with manual override

## 💾 Data Management

### Local Storage Structure
All data is stored locally in your browser using LocalStorage:

```javascript
// Storage Keys
nutriplan_profile     // Personal information
nutriplan_goals       // Nutrition goals
nutriplan_meals       // Planned meals
nutriplan_meal_library // Saved meal library
nutriplan_theme       // Theme preference
```

### Data Privacy
- **100% Local** - No data sent to external servers
- **No Tracking** - No analytics or user tracking
- **Secure** - Input sanitization prevents XSS attacks
- **Portable** - Export/import functionality (future feature)

## 🔧 Customization

### Adding New Meal Types
Edit the meal type options in the HTML files and JavaScript validation:

```javascript
// In meal-planner.js, add to validation
const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'];
```

### Modifying Default Meals
Update the `getDefaultMeals()` function in `js/app.js`:

```javascript
static getDefaultMeals() {
  return [
    {
      foodItem: 'Your Custom Meal',
      calories: 300,
      protein: 25,
      carbs: 30,
      fats: 10,
      // ... other properties
    }
  ];
}
```

### Customizing Themes
Modify CSS custom properties in `css/styles.css`:

```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  /* ... other variables */
}
```

## 📊 Chart Configuration

The application uses Chart.js for data visualization. Charts automatically adapt to the current theme (light/dark mode) and are fully responsive.

### Available Charts
- **Line Charts** - Calories trends over time
- **Doughnut Charts** - Macro distribution
- **Bar Charts** - Weekly comparisons
- **Pie Charts** - Nutrition breakdowns

## 🌐 Browser Support

- **Chrome** 90+ ✅
- **Firefox** 88+ ✅
- **Safari** 14+ ✅
- **Edge** 90+ ✅

### Required Features
- ES6+ JavaScript support
- CSS Grid and Flexbox
- LocalStorage API
- Canvas API (for charts)

## 🚀 Performance

### Optimization Features
- **Lightweight** - No heavy frameworks or libraries
- **Fast Loading** - Minimal dependencies and optimized assets
- **Efficient Storage** - Smart data management with LocalStorage
- **Smooth Animations** - Hardware-accelerated CSS transitions

### Performance Metrics
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Cumulative Layout Shift** < 0.1
- **Time to Interactive** < 3s

## 🔮 Future Enhancements

### Planned Features
- **Data Export/Import** - Backup and restore functionality
- **Meal Suggestions** - AI-powered meal recommendations
- **Barcode Scanning** - Quick food entry via camera
- **Recipe Integration** - Link to popular recipe APIs
- **Social Features** - Share meal plans with friends
- **Offline PWA** - Progressive Web App with offline support

### API Integration Ideas
- **Nutrition APIs** - Edamam, Spoonacular, or USDA FoodData Central
- **Recipe APIs** - Spoonacular Recipe API
- **Fitness Trackers** - MyFitnessPal, Fitbit integration
- **Grocery APIs** - Instacart, grocery store APIs

### Advanced Features
- **Meal Prep Planning** - Batch cooking and prep schedules
- **Shopping Lists** - Auto-generate based on meal plans
- **Nutrition Analysis** - Micronutrient tracking
- **Goal Coaching** - Personalized tips and guidance
- **Photo Logging** - Visual meal tracking
- **Habit Tracking** - Streak counters and achievement badges

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

### Development Setup
1. Clone the repository
2. Open in your favorite code editor
3. Use a local server for development
4. Test across different browsers and devices

### Code Style
- **Clean Code** - Well-commented and readable
- **Semantic HTML** - Proper element usage and structure
- **Modern CSS** - CSS Grid, Flexbox, and custom properties
- **Vanilla JS** - ES6+ features with browser compatibility
- **Accessibility** - ARIA labels, keyboard navigation, and screen reader support

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Chart.js** - Beautiful, responsive charts
- **Google Fonts** - Inter font family
- **Unicode Consortium** - Emoji icons
- **MDN Web Docs** - Comprehensive web development resources

## 📞 Support

For questions or issues:
1. Check the browser console for error messages
2. Ensure your browser supports modern JavaScript features
3. Try clearing LocalStorage data if experiencing issues
4. Test in an incognito/private browsing window

---

**Built with ❤️ for health-conscious individuals and athletes who want to fuel smarter with balanced meals.**
