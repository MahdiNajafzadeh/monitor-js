const joi = require("joi");

const joiFunction = joi
  .custom((value, helper) => {
    return typeof value === "function" ? value : helper.error("setter must be a function");
  })
  .required();

/**
 * @name MonitorJS
 * @author Mahdi Najafzadeh
 * @description MonitorJS is a simple & flexible library for monitoring and analyzing data.
 *              It offers functionalities to track, analyze, and set alerts based on monitored data.
 * @version 1.0.0
 */

class MonitorJS {
  /**
   * Represents the schema for time units used in MonitorJS.
   * @type {string}
   * @pattern /^\d+_[smh]$/ - The pattern for time units in the format: [Number]_[s (seconds) | m (minutes) | h (hours)]
   */
  timeSchema = joi.string().pattern(/^\d+_[smh]$/);
  /**
   * Represents conditions used for comparison in MonitorJS.
   * @type {Object.<string, string>}
   * @property {string} equal - Compares if the current value is equal to a reference value.
   * @property {string} more - Compares if the current value is greater than a reference value.
   * @property {string} less - Compares if the current value is less than a reference value.
   * @property {string} equal_pct - Compares if the current percentage value is equal to a reference value.
   * @property {string} more_pct - Compares if the current percentage value is greater than a reference value.
   * @property {string} less_pct - Compares if the current percentage value is less than a reference value.
   * @property {string} equal_avg - Compares if the current average value is equal to a reference value.
   * @property {string} more_avg - Compares if the current average value is greater than a reference value.
   * @property {string} less_avg - Compares if the current average value is less than a reference value.
   * @property {string} equal_avg_pct - Compares if the current average percentage value is equal to a reference value.
   * @property {string} more_avg_pct - Compares if the current average percentage value is greater than a reference value.
   * @property {string} less_avg_pct - Compares if the current average percentage value is less than a reference value.
   */
  conditions = {
    equal: "now ===",
    more: "now >",
    less: "now <",
    equal_pct: "nowPct ===",
    more_pct: "nowPct >",
    less_pct: "nowPct <",
    equal_avg: "avg ===",
    more_avg: "avg >",
    less_avg: "avg <",
    equal_avg_pct: "avgPct ===",
    more_avg_pct: "avgPct >",
    less_avg_pct: "avgPct <",
  };
  /**
   * Represents the schema for defining alerts in MonitorJS.
   * @typedef {Object} AlertSchema
   * @property {string} name - The name of the alert (required).
   * @property {string|Function} condition - The condition for triggering the alert, either a string from predefined conditions or a custom function (required).
   * @property {number} value - The value used in the comparison for triggering the alert (required).
   * @property {Function} [function] - An optional custom function associated with the alert.
   * @property {string[]} [times] - An array of time units for which the alert should be checked.
   */
  /**
   * Represents the schema for alerts used in MonitorJS.
   * @type {AlertSchema}
   */
  alertSchema = joi.object({
    name: joi.string().required(),
    condition: joi.alternatives([joi.string().valid(...Object.keys(this.conditions)), joiFunction]).required(),
    value: joi.number().required(),
    function: joiFunction,
    times: joi.array().items(this.timeSchema),
  });

  /**
   * Represents the schema for defining items in MonitorJS.
   * @typedef {Object} ItemSchema
   * @property {string} name - The name of the item (required).
   * @property {Function} [setter] - The function used to set or retrieve the value of the item.
   * @property {number} [interval=1000] - The interval in milliseconds for updating the item's value.
   * @property {AlertSchema[]} [alerts=[]] - An array of alerts associated with the item, defined by the AlertSchema.
   * @property {string[]} [times=[]] - An array of time units for checking alerts associated with the item.
   * @property {number} [max=100] - The maximum value threshold for the item.
   * @property {number} [min=0] - The minimum value threshold for the item.
   * @property {number} [bufferSize=200] - The size of the buffer storing historical values for the item.
   */
  /**
   * Represents the schema for items used in MonitorJS.
   * @type {ItemSchema}
   */
  itemSchema = joi.object({
    name: joi.string().required(),
    setter: joiFunction,
    interval: joi.number().default(1000),
    alerts: joi.array().items(this.alertSchema).default({}),
    times: joi.array().items(this.timeSchema).default([]),
    max: joi.number().default(100),
    min: joi.number().default(0),
    bufferSize: joi.number().default(200),
  });

  /**
   * Constructor function for the MonitorJS class.
   * Initializes MonitorJS with provided items, sets default properties, and creates data structures.
   * @param {ItemSchema[]} items - An array of items conforming to the ItemSchema for configuration.
   * @constructor
   */
  constructor(items) {
    this.items = {};
    this.db = {};
    this.intervalIds = {};
    for (const item of items) {
      const { value, error } = this.itemSchema.validate(item);
      if (error) {
        throw new Error(error);
      } else {
        const alerts = {};
        for (const alert of value.alerts) {
          alerts[alert.name] = alert;
        }
        value.alerts = alerts;
        this.items[value.name] = value;
        this.db[value.name] = {
          buffer: [],
          bufferSize: value.bufferSize,
          max: value.max,
          min: value.min,
          avg: null,
          avgPct: null,
          now: null,
          nowPct: null,
          sum: null,
        };
      }
    }
  }

  /**
   * Converts a time string into milliseconds based on the provided format.
   * @param {string} time - The time string in the format [Number]_[s (seconds) | m (minutes) | h (hours)].
   * @returns {number} - The converted time in milliseconds.
   */
  timeConverter(time) {
    const [value, mark] = time.split("_");
    let milSec = mark === "h" ? Number(value) * (60 * 60 * 1000) : 0;
    milSec = mark === "m" ? Number(value) * (60 * 1000) : milSec;
    milSec = mark === "s" ? Number(value) * 1000 : milSec;
    return milSec;
  }

  /**
   * Retrieves the data associated with a specific item by its name from the MonitorJS database.
   * @param {string} itemName - The name of the item whose data is to be retrieved.
   * @returns {*} - The data associated with the specified item, or undefined if the item doesn't exist.
   */
  get(itemName) {
    return this.db.hasOwnProperty(itemName) ? this.db[itemName] : undefined;
  }

  /**
   * Updates the data associated with a specific item in the MonitorJS database.
   * Retrieves a new value using the item's setter function, updates the data, and analyzes it.
   * @async
   * @param {string} itemName - The name of the item to update.
   * @returns {Promise<void>} - A promise resolving once the data is updated and analyzed.
   */
  async set(itemName) {
    // get new value
    const newValue = await this.items[itemName].setter();
    // check buffer size
    if (this.db[itemName].bufferSize < this.db[itemName].buffer.length) this.db[itemName].buffer.shift();
    // check first time - not push null in buffer
    if (this.db[itemName].now !== null) this.db[itemName].buffer.push(this.db[itemName].now);
    // push data
    this.db[itemName].now = newValue;
    this.db[itemName].buffer.push(this.db[itemName].now);
    // Analize Data
    this.db[itemName].sum = this.db[itemName].buffer.reduce((sum, value) => sum + value, 0);
    this.db[itemName].avg = this.db[itemName].sum / this.db[itemName].buffer.length;
    this.db[itemName].avgPct = (this.db[itemName].avg / this.db[itemName].max) * 100;
    this.db[itemName].nowPct = (this.db[itemName].now / this.db[itemName].max) * 100;
  }

  /**
   * Checks if an alert condition is met for a specified item in MonitorJS.
   * Evaluates the condition defined for the alert associated with the item.
   * @async
   * @param {string} itemName - The name of the item to check for an alert.
   * @param {string} alertName - The name of the alert to evaluate.
   * @returns {Promise<void>} - A promise resolving after evaluating the alert condition.
   */
  async check(itemName, alertName) {
    const alert = this.items[itemName].alerts[alertName];
    const condition = alert.condition;

    let fire = false;

    if (typeof condition === "string") {
      fire = eval(`this.db[itemName].${this.conditions[condition]} alert.value`);
    } else {
      fire = condition(this.db[itemName]);
    }

    if (fire) {
      const { db, item, alertObject } =
        (await alert.function(this.db[itemName], this.items[itemName], this.items[itemName].alerts[alertName])) || {};
      if (db) this.db[itemName] = db;
      if (item) this.items[itemName] = item;
      if (alertObject) this.items[itemName].alerts[alertName] = alertObject;
    }
  }

  /**
   * Initiates the monitoring process for a specific item in MonitorJS.
   * Sets intervals for updating item values and checking associated alerts based on defined times.
   * @param {string} itemName - The name of the item to monitor.
   * @returns {void}
   */
  run(itemName) {
    this.intervalIds[`${itemName}-interval`] = setInterval(() => this.set(itemName), this.items[itemName].interval);
    for (const time of this.items[itemName].times) {
      for (const alertName of Object.keys(this.items[itemName].alerts)) {
        this.intervalIds[`${itemName}-${alertName}-${time}`] = setInterval(
          () => this.check(itemName, alertName),
          this.timeConverter(time)
        );
      }
    }
  }

  /**
   * Starts the monitoring process for all configured items in MonitorJS.
   * Initiates the monitoring process for each item by calling the 'run' method.
   * @returns {void}
   */
  start() {
    for (const itemName of Object.keys(this.items)) {
      this.run(itemName);
    }
  }
}

module.exports = MonitorJS;
