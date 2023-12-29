const MonitorJS = require("../index");
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