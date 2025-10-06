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
- **Summary Cards**: Quick overview of key parameters with condition-based color coding
- **Trend Analysis**: 3-hour trend arrows showing parameter direction in dedicated indicators
- **Rate of Change**: Average change per hour over the last 3 hours with stability, rising, and falling cues
- **Color-Coded Values**: Latest values and dam generation display in green (good), orange (caution), or red (poor) based on fishing conditions
- **Interactive Filters**: Toggle visibility of different data categories
- **Temperature Units**: Switch between Celsius and Fahrenheit

### 🌊 Comprehensive Water Data
- Real-time water condition data from USGS API
- Displays detailed measurements for each available parameter
- Auto-refresh every hour
- Responsive design that works on mobile and desktop
- Modern, clean interface with dynamic backgrounds

## Fishing Condition Logic

### Green Background (Excellent Fishing)
- Gage Height ≤ 4 ft for past hour **AND**
- Turbidity ≤ 8 NTU for past hour **AND**
- Streamflow ≤ 1000 ft³/s for past hour

### Orange Background (Caution)
- Gage Height ≤ 4 ft for past hour **AND**
- Turbidity between 8 and 9 NTU for past hour
  **OR**
- Gage Height ≤ 4 ft for past hour **AND**
- Streamflow between 1000 ft³/s and 3000 ft³/s for past hour
  **OR**
- Gage Height ≤ 4 ft for past hour **AND**
- Dam generation ≥ 5 MW is active or was recorded within the last 6 hours

### Red Background (Poor Fishing)
- Gage Height > 4 ft for past hour **OR**
- Turbidity ≥ 9 NTU for past hour **OR**
- Streamflow ≥ 3000 ft³/s for past hour

## Condition-Based Value Coloring

Latest values in summary cards are color-coded based on fishing condition thresholds:

### Gage Height
- 🟢 **Green (Good)**: < 3.5 ft
- 🟠 **Orange (Caution)**: 3.5 - 4 ft
- 🔴 **Red (Poor)**: > 4 ft

### Turbidity
- 🟢 **Green (Good)**: ≤ 8 NTU
- 🟠 **Orange (Caution)**: 8 - 9 NTU
- 🔴 **Red (Poor)**: ≥ 9 NTU

### Streamflow
- 🟢 **Green (Good)**: ≤ 1000 ft³/s
- 🟠 **Orange (Caution)**: 1000 - 3000 ft³/s
- 🔴 **Red (Poor)**: ≥ 3000 ft³/s

### Temperature
- 🟢 **Green (Good)**: 45 - 65°F
- 🟠 **Orange (Caution)**: 40 - 45°F or 65 - 67°F
- 🔴 **Red (Poor)**: < 40°F or > 67°F

### Dam Generation
- 🟢 **Green (Good)**: < 5 MW with no high generation activity in last 8 hours
- 🟠 **Orange (Caution)**: < 5 MW with high generation activity in last 4-8 hours
- 🔴 **Red (Poor)**: ≥ 5 MW or high generation activity within last 6 hours

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
- **Dam Generation**: Power output from Buford Dam in megawatts with condition-based coloring

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
```

- `index.html` contains the full dashboard markup and links to all external assets.
- `assets/css/styles.css` holds all layout, typography, and responsive rules.
- `assets/js/app.js` manages data fetching, state handling, and UI interactions.
- `assets/icons/` stores favicon and installability icons referenced by `index.html` and `site.webmanifest`.
- `site.webmanifest` exposes install metadata for browsers and devices.
- `docs/app-logic.md` documents the fishing condition logic, value coloring thresholds, and application behavior.
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
