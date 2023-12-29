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
npm install fast-monitor-js
```
YARN:
```bash
yarn add fast-monitor-js
```

## Usage

### Example 1
```javascript
const MonitorJS = require('fast-monitor-js');

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
const MonitorJS = require('fast-monitor-js');

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

Example 3: Custom Alert Action
```javascript
const MonitorJS = require('fast-monitor-js');

// Define an item with a custom alert action for fluctuating stock prices
const stockMonitorItem = {
  name: 'Stock Price',
  setter: async () => {
    // Simulate fetching stock price (replace this with your actual data retrieval logic)
    return Math.random() * 200; // Random stock price value for demonstration
  },
  interval: 60000, // Check every minute
  alerts: [
    {
      name: 'Stock Fluctuation Alert',
      condition: 'more', // Check for price increases
      value: 150, // Alert if stock price goes above 150
      function: async (data, item, alert) => {
        // Custom alert action: Log and adjust the alert threshold for next time
        console.log(`Alert: Stock price surged to ${data.now}!`);
        alert.value += 10; // Increase the alert threshold by 10 for the next check
      },
      times: [], // No specific times for this alert
    },
  ],
};

// Create a MonitorJS instance with the stock monitor item
const monitor = new MonitorJS([stockMonitorItem]);

// Start monitoring
monitor.start();
```
This example monitors stock prices and performs a custom alert action by adjusting the alert threshold for the next check whenever the stock price surges.

Example 4: Dynamic Threshold Adjustment

```javascript
const MonitorJS = require('fast-monitor-js');

// Define an item with dynamic threshold adjustment based on historical data
const dynamicThresholdItem = {
  name: 'Dynamic Threshold',
  setter: async () => {
    // Simulate fetching dynamic data (replace this with your actual data retrieval logic)
    return Math.random() * 100; // Random value for demonstration
  },
  interval: 5000, // Check every 5 seconds
  alerts: [
    {
      name: 'Dynamic Threshold Alert',
      condition: 'more', // Check for values greater than the dynamic threshold
      value: 50, // Initial threshold value
      function: async (data, item, alert) => {
        // Calculate dynamic threshold based on historical average
        const historicalAvg = data.avg || 0;
        alert.value = historicalAvg + 10; // Set the new threshold as historical average + 10
        console.log(`Alert: Dynamic value ${data.now} exceeded the adjusted threshold!`);
      },
      times: [], // No specific times for this alert
    },
  ],
};

// Create a MonitorJS instance with the item using a dynamic threshold
const monitor = new MonitorJS([dynamicThresholdItem]);

// Start monitoring
monitor.start();
```

This example demonstrates dynamic threshold adjustment based on historical averages of monitored data.

These examples illustrate Monitor.JS's capabilities to perform custom actions based on monitored data and adjust thresholds dynamically for more efficient monitoring. Feel free to adapt and expand upon these examples to suit your specific monitoring needs.

## Advanced Configuration

### Example: Monitoring CPU and RAM Usage

This example demonstrates how MonitorJS can be used to monitor CPU and RAM usage on a system.

### Setup

- The `getCPUUsage` function retrieves the average CPU usage percentage across all CPU cores using system data provided by Node.js `os` module.
- The `getRAMUsage` function calculates the RAM usage percentage based on total and free memory available on the system.

### Configuration

- Two monitoring items are defined:
  - **CPU Usage Monitoring**
    - **Setter**: Utilizes `getCPUUsage` to fetch CPU usage.
    - **Interval**: Monitors CPU usage every 250 milliseconds.
    - **Alerts**: Triggers an alert if CPU usage exceeds 50%.
    - **Time Interval**: Checks CPU usage against the alert threshold every 10 seconds.
  - **RAM Usage Monitoring**
    - **Setter**: Utilizes `getRAMUsage` to fetch RAM usage.
    - **Interval**: Monitors RAM usage every 500 milliseconds.
    - **Alerts**: Triggers an alert if RAM usage exceeds 50%.
    - **Time Interval**: Checks RAM usage against the alert threshold every 5 seconds.

### Running the Monitor

- The MonitorJS instance is created with these defined monitoring items.
- The `start()` method initiates the monitoring process.

### Alert Actions

- If either CPU or RAM usage exceeds the defined threshold of 50%, an alert message is logged, indicating the current average usage.

### Code 

```javascript
const MonitorJS = require("fast-monitor-js");
const os = require("os");

function getCPUUsage() {
  const cpus = os.cpus();
  let totalUsage = 0;
  cpus.forEach((cpu) => {
    const usage = cpu.times.user + cpu.times.sys;
    const total = cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    totalUsage += usage / total;
  });
  const averageUsage = totalUsage / cpus.length;
  return averageUsage * 100;
}

function getRAMUsage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usedPercentage = (usedMemory / totalMemory) * 100;
  return usedPercentage; // Return as percentage
}

const alerts = [
  {
    name: 'warning on 50 more',
    condition: 'more',
    value: 50,
    function: async (db, item) => {
      console.log(` ${item.name} : avg ${db.avg}`);
    },
  },
];

const items = [
  {
    name: "cpu_usage",
    setter: getCPUUsage,
    interval: 250,
    alerts: alerts,
    times: ["10_s"],
    max: 100,
    min: 0,
  },
  {
    name: "ram_usage",
    setter: getRAMUsage,
    interval: 500,
    alerts: alerts,
    times: ["5_s"],
  },
];

const monitor = new MonitorJS(items)

monitor.start()
```

## Documention

See Full Documetion from this [Page](https://mahdinajafzadeh.github.io/monitor-js/)

## Contributing
We welcome contributions from the community! Fork the repository, make your changes, and submit a pull request.

## License
This project is licensed under the GNU License - see the LICENSE file for details.