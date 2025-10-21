# BuildBuddy - Connecting Customers and Architects

BuildBuddy is a collaborative platform that connects customers with certified architects, similar to how Uber connects riders with drivers. The platform facilitates seamless communication, project management, and secure transactions between clients and architectural professionals.

## 🚀 Features

- **Smart Matching**: AI-powered algorithm to match customers with suitable architects
- **Verified Professionals**: Thoroughly vetted architects with verified credentials
- **Real-time Collaboration**: Integrated chat, video calls, and file sharing
- **Secure Payments**: Milestone-based payments with escrow protection
- **Project Management**: Complete project tracking and management tools
- **Mobile Responsive**: Works perfectly on all devices

## 🛠 Tech Stack

### Frontend
- **React.js** - Modern JavaScript library for building user interfaces
- **CSS3** - Custom responsive styling with CSS Grid and Flexbox
- **Font Awesome** - Icons and visual elements
- **Google Fonts** - Inter font family for modern typography

### Backend
- **Node.js** - JavaScript runtime for server-side development
- **Express.js** - Fast, unopinionated web framework
- **CORS** - Cross-origin resource sharing middleware
- **dotenv** - Environment variable management

## 📁 Project Structure

```
BuildBuddy/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── Hero.js
│   │   │   ├── Features.js
│   │   │   ├── HowItWorks.js
│   │   │   ├── Testimonials.js
│   │   │   └── Footer.js
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   ├── App.css
│   │   │   ├── Header.css
│   │   │   ├── Hero.css
│   │   │   ├── Features.css
│   │   │   ├── HowItWorks.css
│   │   │   ├── Testimonials.css
│   │   │   └── Footer.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── backend/
│   ├── server.js
│   ├── .env
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/BuildBuddy.git
   cd BuildBuddy
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

### Running the Application

#### Development Mode

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

#### Production Mode

1. **Build the Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the Production Server**
   ```bash
   cd backend
   npm start
   ```
   The full application will be available on `http://localhost:5000`

## 🔧 API Endpoints

### Public Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/architects` - Get list of architects (with filters)
- `GET /api/stats` - Get platform statistics
- `POST /api/contact` - Submit contact form
- `POST /api/projects` - Submit new project
- `POST /api/newsletter` - Subscribe to newsletter

### Example API Usage

```javascript
// Get architects with filters
fetch('/api/architects?specialization=residential&location=mumbai&rating=4.5')
  .then(response => response.json())
  .then(data => console.log(data));

// Submit a project
fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Modern House Design',
    description: 'Looking for a modern architectural design...',
    budget: '$50,000',
    location: 'Mumbai, Maharashtra',
    projectType: 'residential'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🎨 Design System

### Color Palette
- **Primary**: #2563eb (Blue)
- **Secondary**: #10b981 (Green)
- **Accent**: #f59e0b (Amber)
- **Text Primary**: #1f2937 (Dark Gray)
- **Text Secondary**: #6b7280 (Medium Gray)
- **Background**: #f9fafb (Light Gray)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: 600-800 weight
- **Body Text**: 400-500 weight
- **Responsive**: Scales appropriately on all devices

## 📱 Responsive Design

The application is fully responsive and tested on:
- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

## 🔮 Future Enhancements

- User authentication and authorization
- Real-time messaging system
- File upload and document management
- Payment integration (Stripe)
- Advanced search and filtering
- Mobile app development
- Video conferencing integration
- Portfolio management system
- Review and rating system
- Advanced analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by successful marketplace platforms like Uber, Airbnb, and Upwork
- Design inspiration from modern architectural websites
- Thanks to the React and Node.js communities for excellent documentation

## 📞 Support

For support, email hello@buildbuddy.com or join our Slack channel.

---

**BuildBuddy** - *Building dreams, one project at a time.*