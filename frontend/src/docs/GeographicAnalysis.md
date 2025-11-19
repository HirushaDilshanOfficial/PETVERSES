# Geographic Analysis Feature

## Overview

The Geographic Analysis feature provides a visual representation of where users and services are concentrated across Sri Lanka. This feature helps administrators understand the geographic distribution of their user base and service providers.

## Features

1. Interactive map visualization using Leaflet
2. Distinct markers for users (blue) and services (green)
3. Location distribution statistics
4. Top areas by concentration
5. Responsive design for all screen sizes

## Implementation Details

### Components

- `GeographicAnalysisPage.jsx` - Main page component
- `GeographicAnalysis.jsx` - Core map visualization component
- `geoDataSample.js` - Sample data for development/testing

### Dependencies

- `leaflet` - Mapping library
- `react-leaflet` - React components for Leaflet maps

### Data Structure

The feature expects location data in the following format:

```javascript
// User object with location
{
  _id: "user1",
  fullName: "John Doe",
  email: "john@example.com",
  location: {
    latitude: 6.9271,
    longitude: 79.8612,
    city: "Colombo"
  }
}

// Service object with location
{
  _id: "service1",
  title: "Pet Grooming Service",
  category: "Grooming",
  location: {
    latitude: 6.9271,
    longitude: 79.8612,
    city: "Colombo"
  }
}
```

## How to Use

1. Navigate to the Admin Dashboard
2. Click on "Geographic Analysis" in the sidebar
3. View the interactive map with user and service locations
4. Use the statistics panel to understand distribution patterns

## Development

### Testing with Sample Data

During development, the component uses sample data from `geoDataSample.js`. To test with real data:

1. Ensure your backend API provides location data in the expected format
2. Remove or comment out the development mode check in `GeographicAnalysis.jsx`

### Customization

- To change the default map center, modify the `sriLankaCenter` variable
- To change marker colors, update the color properties in the CircleMarker components
- To modify the map style, update the TileLayer URL

## Troubleshooting

### Map Not Loading

- Check that the Leaflet CSS is imported
- Verify that the API is returning location data
- Ensure latitude/longitude values are valid numbers

### Markers Not Appearing

- Verify that location data includes both latitude and longitude
- Check that the data structure matches the expected format
- Ensure that the location filtering logic is working correctly

## Future Enhancements

1. Add clustering for dense areas
2. Implement heat maps for better visualization
3. Add filtering options for users/services
4. Include time-based analysis
5. Add export functionality for location data
