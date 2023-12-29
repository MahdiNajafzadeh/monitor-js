const { stat } = require("fs");
const os = require("os");
const { resolve } = require("path");
const si = require("systeminformation");

function getCPUUsage() {
  const cpus = os.cpus();
  // Calculate average CPU usage across all cores
  let totalUsage = 0;
  cpus.forEach((cpu) => {
    const usage = cpu.times.user + cpu.times.sys;
    const total = cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    totalUsage += usage / total;
  });
  const averageUsage = totalUsage / cpus.length;
  return averageUsage * 100; // Return as percentage
}

function getRAMUsage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usedPercentage = (usedMemory / totalMemory) * 100;
  return usedPercentage; // Return as percentage
}

const info = {
  items: {
    cpu_usage: {
      fun: () => info.set({ cpu_usage: getCPUUsage() }),
      interval: 100,
      limit: 100,
      warn: 80,
      step: 10,
      times: ["1_s"],
    },
    ram_usage: {
      fun: () => info.set({ ram_usage: getRAMUsage() }),
      interval: 100,
      limit: 100,
      warn: 80,
      step: 10,
      times: ["1_s"],
    },
  },
  alert: {
    limit(name, time, item, data) {
      console.log(`[limit] ${name} / ${time} / limit --> ${item["limit"]} / avg ${data.avg} : now ${data.now}`);
    },
    warn(name, time, item, data) {
      console.log(`[warn] ${name} / ${time} / warn --> ${item["warn"]} / avg ${data.avg} : now ${data.now}`);
    },
    step(name, time, item, data, status) {
      console.log(
        `[step] ${name} / ${time} / step [${status}] --> ${item["step"]} / avg ${data.avg} : now ${data.now}`
      );
      for (let step = 0; step < item.limit; step += item.step) {
        if ((step <= data.avg) && (data.avg <= (step + item.step))) {
          item.step_up = step + item.step;
          item.step_down = step;
        }
      }
      info.items[name] = item;
    },
  },
  data: {},
  set(data) {
    Object.keys(data).forEach((item) => {
      if (!this.data[item]) this.data[item] = { all: [], avg: 0, now: 0 };
      if (100 < this.data[item]["all"].length) this.data[item]["all"].shift();
      this.data[item]["now"] = parseFloat(data[item].toFixed(2));
      this.data[item]["all"].push(this.data[item]["now"]);
      let total = 0;
      this.data[item]["all"].forEach((i) => (total += i));
      this.data[item]["avg"] = parseFloat((total / this.data[item]["all"].length).toFixed(2));
    });
  },
  get(item) {
    return this.data.hasOwnProperty(item) ? this.data[item] : {};
  },
  run(name, item) {
    setInterval(item.fun, item.interval);
    item.times.forEach((time) => {
      const [timeNumber, timeStandard] = time.split("_");
      let timeOut = 0;
      timeOut = timeStandard === "h" ? Number(timeNumber) * (60 * 60 * 1000) : timeOut;
      timeOut = timeStandard === "m" ? Number(timeNumber) * (60 * 1000) : timeOut;
      timeOut = timeStandard === "s" ? Number(timeNumber) * 1000 : timeOut;
      setInterval(() => {
        const data = info.get(name);
        if (item.limit <= data.avg) info.alert.limit(name, time, item, data);
        if (item.warn <= data.avg) info.alert.warn(name, time, item, data);
        if (!item.hasOwnProperty("step_up")) {
          item.step_up = item.step;
          item.step_down = 0;
          this.alert.step(name, time, item, data, "init");
          return;
        }
        if (item.step_up <= data.avg) info.alert.step(name, time, item, data, "up");
        if (data.avg <= item.step_down) info.alert.step(name, time, item, data, "down")
      }, timeOut);
    });
  },
  start() {
    Object.keys(this.items).forEach((item) => this.run(item, this.items[item]));
  },
};

info.start();
