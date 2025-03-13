# Project Overview

Our website will be an interactive platform designed to showcase player statistics from the NBA, NFL, and Premier League. The homepage will present dynamic "Trending Players" sections for each sport, allowing users to quickly see the top five performers based on recent data. From this main screen, users can seamlessly navigate to detailed player profiles and team information—including performance metrics, standings, and rosters. While our primary focus is on delivering clear, real-time trending data with intuitive navigation, we also plan to explore advanced enhancements such as normalized data analysis to identify statistical outliers (by computing z-scores for key metrics) and unique visualizations like performance trend lines, scatter plots, and interactive heat maps. These enhancements, time permitting, will offer deeper insights and set our platform apart from traditional sports statistics sites.

# Features

1. Multi-League Coverage
Aggregates statistics and trends for NBA, NFL, and Premier League
Easy navigation between different leagues
2. Trending Players Section
Displays the top 5 trending players in each league
Updates dynamically based on recent performance and popularity
3. Players and Teams Categories
Allows users to explore detailed player profiles and team data
Includes insights on team performance, standings, and rosters
4. Interactive Navigation
Features clickable "Players" and "Teams" buttons for each league
Directs users to dedicated pages with in-depth information

# Tech Stack

**Frontend**
- React.js : Component-based UI library
- React Router : Client-side routing and navigation
- Axios : HTTP client for API requests
- Vite : Fast development and build tool

**Backend**
- Node.js : JavaScript runtime environment
- Express : Web application framework
- MongoDB - Database for storing sports data
- Mongoose - MongoDB object modeling

**Data Sources**
- NBA : REST NBA API for team and player statistics
- NFL : Currently mock data (real API integration planned)
- EPL : API-Football for Premier League data

**DevOps**
- Nodemon : Development server
- MongoDB Atlas : Cloud database service

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


# Setup Instructions
**Prerequisites**
- Node.js v18+ and npm installed
- MongoDB Atlas account
- Repository cloned from GitHub

**Backend Setup**
1. Navigate to the backend directory:
    'cd backend'
2. Install dependencies:
    'npm install'
3. Set up environment variables by creating a .env file (in the backend directory) with:
    PORT=5000
    MONGODB_URI=the_mongodb_connection_string
    EPL_API_KEY=the_api_football_key
4. Start the backend server:
    'npm run dev'

**Frontend Setup**
1. In the root directory, install dependencies:
    'npm install'
2. Start the development server:
    'npm run dev'
3. Open the provided link (usually http://localhost:5173) in your browser

# Data Update Process
The application features a dedicated update system accessible through the "Update Data" button in the header. This process:

1. Fetches the latest data from external APIs for all three sports leagues
2. Processes player trades and team changes (especially important for NBA data)
3. Calculates per-game statistics and other derived metrics
4. Updates the MongoDB database with the latest information
5. Records the update timestamp which is displayed on the homepage

# Key Implementation Notes
- Player Trading Handling: Special processing for NBA players who have been traded between teams
- API Rate Limiting: Staggered requests with delays to prevent hitting API limits
- Flexible Schema Design: Using MongoDB Maps for sport-specific statistics
- Responsive Design: Adapts to different screen sizes for mobile and desktop usage