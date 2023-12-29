# Monitor.JS

Monitor.JS is a flexible and lightweight JavaScript library designed for monitoring and tracking data in real-time.

## Features

- Real-time data monitoring
- Customizable alert system
- Performance analysis and metrics
- Easy integration and setup

## Installation

You can install Monitor.JS from this ways

via NPM:
```bash
npm install monitor-js
```
YARN:
```bash
yarn add monitor-js
```

## Usage

### Example 1
```javascript
const MonitorJS = require('monitor-js');

// Define an item to monitor
const itemToMonitor = {
  name: 'Temperature',
  setter: async () => {
    // Simulate fetching temperature data (replace this with your actual data retrieval logic)
    return Math.random() * 100; // Random temperature value for demonstration
  },
  interval: 3000, // Check every 3 seconds
  alerts: [], // No alerts defined in this example
};

// Create a MonitorJS instance with the item to monitor
const monitor = new MonitorJS([itemToMonitor]);

// Start monitoring
monitor.start();

// Access monitored data after a while
setTimeout(() => {
  const temperatureData = monitor.get('Temperature');
  console.log('Current temperature:', temperatureData.now);
}, 10000); // After 10 seconds
```

### Example 2 
```javascript
const MonitorJS = require('monitor-js');

// Define an item with an alert for high CPU usage
const cpuMonitorItem = {
  name: 'CPU Usage',
  setter: async () => {
    // Simulate fetching CPU usage (replace this with your actual data retrieval logic)
    return Math.random() * 100; // Random CPU usage value for demonstration
  },
  interval: 5000, // Check every 5 seconds
  alerts: [
    {
      name: 'High CPU Alert',
      condition: 'more', // 'more' indicates greater than a specified value
      value: 80, // Alert if CPU usage goes above 80%
      function: async (data, item, alert) => {
        console.log(`Alert: High CPU usage detected! Current usage: ${data.now}%`);
        // Custom alert action or modification to data/item/alert object can be performed here
      },
      times: [], // No specific times for this alert
    },
  ],
};

// Create a MonitorJS instance with the CPU monitor item
const monitor = new MonitorJS([cpuMonitorItem]);

// Start monitoring
monitor.start();
```

## Advanced Configuration
```javascript
// Add a more complex code example showcasing advanced features
// Configuration options, setting up alerts, etc.
```
## Documentation
Check out the full documentation for detailed usage instructions, API references, and examples.

## Contributing
We welcome contributions from the community! Fork the repository, make your changes, and submit a pull request.

## License
This project is licensed under the GNU License - see the LICENSE file for details.

## Acknowledgements
Mention any contributors or third-party libraries used
If applicable, acknowledge any inspiration or resources used in the development