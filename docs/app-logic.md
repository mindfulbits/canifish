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


## Current Summary Title latest-value
I have three possible conditions: 
Good, Caution, and Poor

Good rgba(76, 175, 80, 0.9)
- Gage Height (ft) < 3.5 ft for past hour
- Turbidity ≤ 8 NTU for past hour
- Streamflow (ft³/s) ≤ 1000 ft³/s for past hour

Caution rgba(255, 152, 0, 0.5)
- Gage Height (ft) between 3.5 nad 4 ft for past hour
- Turbidity between 8 and 9 NTU for past hour
- Streamflow (ft³/s) between 1000 ft³/s and 3000 ft³/s for past hour

Poor  rgba(244, 67, 54, 0.9)
- Gage Height (ft) > 4 ft for past hour
- Turbidity ≥ 9 NTU for past hour
- Streamflow (ft³/s) ≥ 3000 ft³/s for past hour
- Dam generation ≥ 5 MW is active or was recorded within the last 6 hours





please use the logic and add an additional class (.good, .caution, .poor) for 'latest-value' in the summary-cards-section. Only add the class if the condition is met. 
Also for Temapature account for conversion to Celsius as well.

class = good
- Gage Height (ft) < 3.5 ft for past hour
- Turbidity ≤ 8 NTU for past hour
- Streamflow (ft³/s) ≤ 1000 ft³/s for past hour
- Temperature (°F) between 45 and 65


class = caution
- Gage Height (ft) between 3.5 nad 4 ft for past hour
- Turbidity between 8 and 9 NTU for past hour
- Streamflow (ft³/s) between 1000 ft³/s and 3000 ft³/s for past hour
- Temperature (°F) between 40 and 45 or 65 and 67


class = poor
- Gage Height (ft) > 4 ft for past hour
- Turbidity ≥ 9 NTU for past hour
- Streamflow (ft³/s) ≥ 3000 ft³/s for past hour
- Temperature (°F) below 40 or above 67





now using the data From the USACE Data collector please use the following logic and add an additional class (.good, .caution, .poor) to the 'dam-current-value' in the dam-summary-card.

class = good
- Buford Dam Generation < 5 MW is not active or was recorded within the last 8 hours

class = caution
- Buford Dam Generation < 5 MW is not active or was recorded within the last 4 hours

class = poor
- Buford Dam Generation ≥ 5 MW is active or was recorded within the last 6 hours
