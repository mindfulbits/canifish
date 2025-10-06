# CanIFish - Intelligent Fishing Conditions Dashboard

An advanced HTML dashboard that displays real-time water conditions and provides intelligent fishing condition analysis for the Chattahoochee River near Norcross, GA (USGS Station 02335000).

## Release Status

CanIFish is currently in **Alpha**. The landing header in `index.html` renders an `Alpha` badge next to the project title to make the release channel clear during testing. Badge styling lives in `assets/css/styles.css` (`.badge`, `.badge-alpha`) so visual treatments remain consistent across the site.

## Features

### 🎣 Intelligent Fishing Conditions
- **Smart Background Colors**: Visual indicators for fishing conditions
- 🟢 **Green**: Excellent fishing conditions (Low turbidity, normal water level, low streamflow, no recent dam generation)
- 🟠 **Orange**: Caution conditions (Good water quality with recent dam generation or elevated streamflow)
- 🔴 **Red**: Poor fishing conditions (High water levels, high streamflow, or extended dam generation)
- **Real-time Analysis**: Automatically evaluates turbidity, gage height, and dam generation patterns
- **Condition Notifications**: Floating indicators with specific fishing advice that appear on page load and data refresh, auto-hiding after 8 seconds

### 🏗️ Dam Generation Integration
- **USACE Data**: Real-time Buford Dam generation schedules
- **Generation Tracking**: Monitors power generation levels and duration
- **Change Predictions**: Shows upcoming generation schedule changes
- **Historical Analysis**: Tracks generation patterns over time

### 📊 Enhanced Data Visualization
- **Summary Cards**: Quick overview of key parameters with trend indicators
- **Trend Analysis**: 3-hour trend arrows showing parameter direction (applied to trend indicators only)
- **Rate of Change**: Average change per hour over the last 3 hours with stability, rising, and falling cues
- **Condition-Based Styling**: Latest values are color-coded based on fishing condition thresholds (gage height, turbidity, streamflow, temperature only)
- **Interactive Filters**: Toggle visibility of different data categories
- **Temperature Units**: Switch between Celsius and Fahrenheit

### 🌊 Comprehensive Water Data
- Real-time water condition data from USGS API
- Displays detailed measurements for each available parameter
- Auto-refresh every hour
- Responsive design that works on mobile and desktop
- Modern, clean interface with dynamic backgrounds

## Fishing Condition Logic

### Summary Card Latest-Value Styling (Per-Category)

Latest values are color-coded based on individual parameter thresholds:

#### Gage Height
- 🟢 **Good** (< 3.5 ft)
- 🟠 **Caution** (3.5 - 4 ft)
- 🔴 **Poor** (> 4 ft)

#### Turbidity
- 🟢 **Good** (≤ 8 NTU)
- 🟠 **Caution** (8 - 9 NTU)
- 🔴 **Poor** (≥ 9 NTU)

#### Streamflow
- 🟢 **Good** (≤ 1000 ft³/s)
- 🟠 **Caution** (1000 - 3000 ft³/s)
- 🔴 **Poor** (≥ 3000 ft³/s)

#### Temperature (°F)
- 🟢 **Good** (45 - 65°F)
- 🟠 **Caution** (40-45°F or 65-67°F)
- 🔴 **Poor** (< 40°F or > 67°F)

### Background Color Logic (Overall Conditions)

#### Green Background (Excellent Fishing)
- Gage Height ≤ 4 ft for past hour **AND**
- Turbidity ≤ 8 NTU for past hour **AND**
- Streamflow ≤ 1000 ft³/s for past hour **AND**
- Temperature 45-65°F for past hour **AND**
- Dam generation < 5 MW or not active within last 8 hours

#### Orange Background (Caution)
- Gage Height ≤ 4 ft for past hour **AND**
- Turbidity between 8 and 9 NTU for past hour
  **OR**
- Gage Height ≤ 4 ft for past hour **AND**
- Streamflow between 1000 ft³/s and 3000 ft³/s for past hour
  **OR**
- Gage Height ≤ 4 ft for past hour **AND**
- Temperature 40-45°F or 65-67°F for past hour
  **OR**
- Gage Height ≤ 4 ft for past hour **AND**
- Dam generation ≥ 5 MW is active or was recorded within the last 4-6 hours

#### Red Background (Poor Fishing)
- Gage Height > 4 ft for past hour **OR**
- Turbidity ≥ 9 NTU for past hour **OR**
- Streamflow ≥ 3000 ft³/s for past hour **OR**
- Temperature < 40°F or > 67°F for past hour **OR**
- Dam generation ≥ 5 MW is active or was recorded within the last 6 hours

## Usage

Simply open `index.html` in any modern web browser. The dashboard will automatically:

1. Fetch real-time water condition data from USGS API
2. Retrieve current dam generation schedules from USACE
3. Analyze conditions and apply intelligent fishing recommendations
4. Display comprehensive data with trend analysis
5. Auto-refresh all data hourly

## Data Sources

### USGS Water Services API
- **Site**: 02335000 (Chattahoochee River near Norcross, GA)
- **Data Period**: Last 3 hours to 30 days
- **Update Frequency**: Every 15 minutes
- **Parameters**: Flow, temperature, pH, dissolved oxygen, turbidity, gage height

### USACE Dam Generation Data
- **Dam**: Buford Dam/Lake Sidney Lanier
- **Data**: Real-time and scheduled power generation
- **Update Frequency**: Hourly
- **Coverage**: Previous day, Current day and next day if available

## Parameters Displayed

The dashboard shows comprehensive water quality and operational parameters:
- **Stream Flow**: Discharge rate in cubic feet per second
- **Gage Height**: Water level in feet
- **Water Temperature**: Current temperature with trend analysis
- **Turbidity**: Water clarity measurement
- **pH Levels**: Water acidity/alkalinity
- **Dissolved Oxygen**: Oxygen content in water
- **Dam Generation**: Power output from Buford Dam in megawatts

## Project Structure

```
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── icons/
│       ├── apple-touch-icon.png
│       ├── favicon-16x16.png
│       ├── favicon-32x32.png
│       ├── favicon.ico
│       ├── android-chrome-192x192.png
│       ├── android-chrome-512x512.png
│       └── safari-pinned-tab.svg
├── site.webmanifest
└── docs/
    ├── app-logic.md
    └── INDEX_REVIEW.md
- `assets/icons/` stores favicon and installability icons referenced by `index.html` and `site.webmanifest`.
- `site.webmanifest` exposes install metadata for browsers and devices.
- `docs/app-logic.md` contains detailed documentation of fishing condition logic and thresholds.
- `docs/INDEX_REVIEW.md` captures the latest manual review notes and priorities.

## Technical Details

- Pure HTML, CSS, and JavaScript (no external dependencies)
- Uses the Fetch API for HTTP requests
- Responsive CSS Grid layout with breakpoints defined in `assets/css/styles.css`
- Error handling for network issues
- Direct API access with CORS proxy fallbacks
- Demo data mode when live API is unavailable
- Progressive web app manifest via `site.webmanifest`, aligned with icons in `assets/icons/`

## API Access & Reliability

The dashboard prioritizes direct API access to official data sources, with automatic fallbacks for maximum reliability:

1. **Direct API Access**: Primary method using CORS-supported APIs from USGS and GitHub
2. **CORS Proxy Fallbacks**: Automatic fallback to proxy services if direct access fails
3. **Error Handling**: Graceful degradation when all endpoints are unavailable

### Data Sources
- **USGS Water Services**: Direct CORS-enabled API access to real-time water data
- **USACE Dam Data**: Direct access to GitHub-hosted generation schedules
- **Proxy Services**: AllOrigins, CORS Proxy, and CORS Anywhere as reliability backups

### Running with a Local Server

For reliable API access, serve the page from a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have it)
npx serve .

# Then open: http://localhost:8000
```

## Browser Compatibility

Works with all modern browsers that support:
- ES6 JavaScript features
- Fetch API
- CSS Grid
- CSS Flexbox

## Local Development

No build process required. Simply:

1. Clone or download the files
2. Open `index.html` in your browser
3. The dashboard will load automatically

## License

This project is open source and available under the MIT License.
