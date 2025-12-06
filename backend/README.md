# Njeyali Travel - Backend API

Complete backend server for Njeyali Travel website with MongoDB database, Express.js REST API, and email notifications.

## 📁 Project Structure

```
backend/
├── models/              # MongoDB schemas
│   ├── Booking.js      # Service bookings
│   ├── Contact.js      # Contact form submissions
│   ├── Newsletter.js   # Newsletter subscriptions
│   ├── Package.js      # Travel packages
│   ├── Testimonial.js  # Customer testimonials
│   └── VisaRequirement.js # Visa requirements data
├── routes/             # API route handlers
│   ├── visa.js        # Visa checking endpoints
│   ├── services.js    # Service bookings endpoints
│   ├── packages.js    # Travel packages endpoints
│   ├── contact.js     # Contact form endpoints
│   ├── testimonials.js # Testimonials endpoints
│   └── newsletter.js  # Newsletter endpoints
├── scripts/           # Utility scripts
│   └── seedDatabase.js # Database seeding
├── utils/             # Helper utilities
│   └── email.js       # Email sending with templates
├── uploads/           # File upload storage
├── server.js          # Main server file
├── package.json       # Dependencies
├── .env.example       # Environment template
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
```
Then edit `.env` with your settings (see Configuration section below)

4. **Seed the database:**
```bash
npm run seed
```

5. **Start the server:**
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## ⚙️ Configuration

### Required Environment Variables

Edit your `.env` file with these settings:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/njeyali-travel

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin
ADMIN_EMAIL=admin@njeyalitravel.com
```

### Email Setup (Gmail Example)

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
4. Use this App Password in your `.env` file as `SMTP_PASS`

### MongoDB Setup

**Option 1: Local MongoDB**
```bash
# Install MongoDB locally
# macOS:
brew install mongodb-community

# Ubuntu:
sudo apt install mongodb

# Start MongoDB
mongod
```

**Option 2: MongoDB Atlas (Cloud)**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster
4. Get connection string
5. Use in `.env` as `MONGODB_URI`

Example Atlas URI:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/njeyali-travel
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status

### Visa Routes
```
GET  /api/visa/countries          # Get all countries
POST /api/visa/check              # Check visa requirements
GET  /api/visa/requirements       # Get detailed requirements
GET  /api/visa/popular-destinations # Get popular destinations
```

### Service Routes
```
POST /api/services/visa-application    # Submit visa application
POST /api/services/flight-booking      # Request flight booking
POST /api/services/hotel-booking       # Request hotel booking
POST /api/services/concierge           # Request concierge service
POST /api/services/corporate-travel    # Request corporate travel
POST /api/services/consultation        # Book consultation
POST /api/services/package-request     # Request package booking
GET  /api/services/booking/:id         # Get booking details
```

### Package Routes
```
GET /api/packages                   # Get all packages
GET /api/packages/featured          # Get featured packages
GET /api/packages/:id               # Get package by ID
GET /api/packages/search            # Search packages
GET /api/packages/destination/:dest # Get packages by destination
GET /api/packages/price-range       # Filter by price
```

### Contact Routes
```
POST /api/contact        # Submit contact form
GET  /api/contact/:id    # Get contact message
```

### Testimonial Routes
```
GET  /api/testimonials          # Get approved testimonials
POST /api/testimonials          # Submit testimonial
GET  /api/testimonials/featured # Get featured testimonials
```

### Newsletter Routes
```
POST /api/newsletter/subscribe    # Subscribe to newsletter
POST /api/newsletter/unsubscribe  # Unsubscribe from newsletter
```

## 🧪 Testing API Endpoints

### Using cURL

**Check visa requirements:**
```bash
curl -X POST http://localhost:3000/api/visa/check \
  -H "Content-Type: application/json" \
  -d '{"nationality":"NG","destination":"US"}'
```

**Submit contact form:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "subject":"Test",
    "message":"This is a test message"
  }'
```

**Get all packages:**
```bash
curl http://localhost:3000/api/packages
```

### Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:3000/api`
3. Test each endpoint

## 📊 Database Models

### Booking
Stores all service bookings (visa, flights, hotels, etc.)
- Fields: serviceType, name, email, phone, status, etc.
- Service-specific fields for each type

### VisaRequirement
Visa requirements for country pairs
- Fields: fromCountry, toCountry, visaRequired, processingTime, requirements, etc.

### Package
Travel package offerings
- Fields: name, destination, price, itinerary, inclusions, etc.

### Contact
Contact form submissions
- Fields: name, email, subject, message, status

### Testimonial
Customer testimonials
- Fields: name, rating, message, serviceType, approved

### Newsletter
Newsletter subscriptions
- Fields: email, name, active, subscribedAt

## 🔐 File Uploads

Files are stored in `/uploads` directory with these limits:
- Maximum size: 10MB
- Allowed types: JPG, PNG, PDF
- Auto-generated unique filenames

Upload endpoints automatically handle:
- File validation
- Size checking
- Secure storage
- Path generation

## 📧 Email Templates

The system includes professional email templates for:
- Visa application confirmation
- Flight booking confirmation
- Hotel booking confirmation
- Concierge request confirmation
- Corporate travel confirmation
- Consultation booking confirmation
- Package request confirmation
- Contact form confirmation
- Newsletter welcome email

All emails are HTML-formatted with:
- Professional design
- Company branding
- Reference IDs
- Next steps information

## 🔍 Error Handling

The API includes comprehensive error handling:
- Validation errors (400)
- Not found errors (404)
- Server errors (500)
- File upload errors
- Database errors

All errors return JSON:
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku app:**
```bash
heroku create njeyali-travel-api
```

2. **Add MongoDB addon:**
```bash
heroku addons:create mongolab:sandbox
```

3. **Set environment variables:**
```bash
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
```

4. **Deploy:**
```bash
git push heroku main
```

5. **Seed database:**
```bash
heroku run npm run seed
```

### Railway Deployment

1. Connect GitHub repository
2. Add MongoDB database
3. Set environment variables
4. Deploy automatically

### VPS Deployment

1. **SSH to server:**
```bash
ssh user@your-server.com
```

2. **Clone repository:**
```bash
git clone https://github.com/your-repo/njeyali-travel.git
cd njeyali-travel/backend
```

3. **Install dependencies:**
```bash
npm install
```

4. **Configure environment:**
```bash
nano .env
```

5. **Install PM2:**
```bash
npm install -g pm2
```

6. **Start server:**
```bash
pm2 start server.js --name njeyali-api
pm2 save
pm2 startup
```

7. **Setup Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name api.njeyalitravel.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛠️ Maintenance

### View Logs
```bash
# Development
npm run dev

# Production with PM2
pm2 logs njeyali-api
```

### Database Backup
```bash
# MongoDB local backup
mongodump --db njeyali-travel --out ./backup

# Restore
mongorestore --db njeyali-travel ./backup/njeyali-travel
```

### Update Dependencies
```bash
npm update
npm audit fix
```

## 📝 npm Scripts

```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
npm run seed    # Seed database with sample data
```

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is available
- Verify MongoDB is running
- Check `.env` file exists and is configured

### Database connection failed
- Verify MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`
- For Atlas, check IP whitelist

### Emails not sending
- Verify SMTP credentials
- Check firewall/port 465
- For Gmail, use App Password, not regular password

### File uploads failing
- Check uploads directory exists and is writable
- Verify file size under 10MB
- Check file type (JPG, PNG, PDF only)

## 📞 Support

For issues or questions:
- Email: admin@njeyalitravel.com
- Check logs for error messages
- Review this README

## 🎉 Success Checklist

- [ ] MongoDB connected successfully
- [ ] Database seeded with sample data
- [ ] Server starts without errors
- [ ] Health check returns status
- [ ] Countries load in visa checker
- [ ] Test email sending (check spam folder)
- [ ] File upload working
- [ ] All API endpoints tested

## 📄 License

MIT License - Njeyali Travel © 2025
