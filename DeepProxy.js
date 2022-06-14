class DeepProxy {
  
  #callbacks;
  #settings;
  #handler;
  #saveEvents;
  #events;
  #proxy;
  
  constructor(source = {}, settings = {}) {

    // member initializing
    this.#callbacks = {};
    this.#saveEvents = false;
    this.#events = [];

    // checking for custom handler and validating settings
    this.#settings = settings;
    if(settings.as_handler) 
      this.#handler = settings;
    else 
      this.#validateSettings();

    this.#proxy = this.#create(source);
  }

  on(event, callback) {
    // check event
    if(!DeepProxy.#isSymbol(event)) throw new Error(`There is no ${event} event`);
    if(!(event.description in DeepProxy.Events)) throw new Error(`There is no ${event.description} event`);

    // check callback
    if(callback === undefined) throw new Error("callback is undefined");
    if(typeof callback !== "function") throw new Error("callback is not a function");

    // add callback to array and return
    this.#callbacks[event.description] = callback;
    return this;
  }

  remove(event) {
    // check event
    if(!DeepProxy.#isSymbol(event)) throw new Error(`There is no ${event} event`);
    if(!(event.description in DeepProxy.Events)) throw new Error(`There is no ${event.description} event`);
    
    // remove callback and return
    delete this.#callbacks[event.description]
    return this;
  }

  #call(event, ...args) {
    if(!DeepProxy.#isSymbol(event)) return DeepProxy.Events.CANCELED;
    if(!this.#callbacks[event.description]) return DeepProxy.Events.CANCELED;
    return this.#callbacks[event.description](...args);
  }

  #create(source, parrent, parentKey) {
    let map = {};
    let info = {parrent, parentKey, proxy: new Proxy(source, {
      // custom
      apply: (target, parrentProxy, args) => {
        console.log("apply arguments:", target, parrentProxy, args)
        console.log("info", info)
        
        if(this.#handler && DeepProxy.#isFunction(this.#handler.apply)) return this.#handler.apply(target, parrentProxy, args);
        
        let f_res, res;

        if(this.#settings.default_action) {
          if(this.#settings.contain_function_events) this.#saveEvents = true;
          f_res = target(...args);
          this.#saveEvents = false;
        }
        
        let path = this.#trace(info.parent, info.parentKey)
        if(this.#settings.path_as_array) path = DeepProxy.formatPath(path);
        
        let eventData = {events: [...this.#events], target, name: info.parentKey, args, parrentProxy, parentPath: path.target, targetPath: path.value};
        res = this.#call(DeepProxy.Events.FUNCTION_CALL, eventData);
        
        this.#events = [];
        return this.#settings.default_action? f_res : (res === DeepProxy.Events.CANCELED? target(...args) : res);
      },
      construct: (target, args, proxy) => {
        console.log("construct arguments:", target, args, proxy)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.construct)) return this.#handler.construct(target, args, proxy);

        let path = this.#trace(info.parent, info.parentKey)
        if(this.#settings.path_as_array) path = DeepProxy.formatPath(path);
        
        let eventData = {target, args, name: info.parentKey, proxy, targetPath: path.target, valuePath: path.value};
        let res = this.#call(DeepProxy.Events.CONSTRUCTOR_CALL, eventData);
        
        return this.#settings.default_action || res === DeepProxy.Events.CANCELED? new target(...args) : res;
      },
      set: (target, key, value, proxy) => {
        console.log("set arguments:", target, key, value, proxy)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.set)) return this.#handler.set(target, key, value, proxy);

        let path = this.#trace(info, key)
        if(this.#settings.path_as_array) path = DeepProxy.formatPath(path);

        let eventData = {target, key, value, proxy, targetPath: path.target, valuePath: path.value};
        let res = this.#call(DeepProxy.Events.SET, eventData);
        
        if(this.#settings.default_action || res === DeepProxy.Events.CANCELED) {
          target[key] = DeepProxy.#isObject(value) || DeepProxy.#isFunction(value)? this.#create(value, info, key) : value;
          map[key] = true;
          return true;
        }
        return res;
      },
      get: (target, key, proxy) => {
        console.log("get arguments:", target, key, proxy)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.get)) return this.#handler.get(target, key, proxy);
        
        if(!map[key] && target[key]) {
          let value = target[key]
          target[key] = DeepProxy.#isObject(value) || DeepProxy.#isFunction(value)? this.#create(value, info, key) : value;
          map[key] = true;
        }

        let path = this.#trace(info, key);
        if(this.#settings.path_as_array) path = DeepProxy.formatPath(path);

        let eventData = {target, key, proxy, targetPath: path.target, valuePath: path.value};
        let res = this.#call(DeepProxy.Events.GET, eventData);
        
        return this.#settings.default_action || res === DeepProxy.Events.CANCELED? target[key] : res;
      },
      deleteProperty: (target, key) => {
        console.log("deleteProperty arguments:", target, key)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.deleteProperty)) return this.#handler.deleteProperty(target, key);

        let path = this.#trace(info, key);
        if(this.#settings.path_as_array) path = DeepProxy.formatPath(path);
        
        let eventData = {target, key};
        let res = this.#call(DeepProxy.Events.SET, eventData);
        
        if(this.#settings.default_action || res === DeepProxy.Events.CANCELED) {
          if(!(key in target)) return false;
          
          delete target[key];
          delete map[key]
          return true;
        }
        if(res === true) delete map[key]
        return res;
      },

      // default
      defineProperty: (target, key, descriptor) => {
        console.log("defineProperty arguments:", target, key, descriptor)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.defineProperty)) return this.#handler.defineProperty(target, key, descriptor);
        return Reflect.defineProperty(target, key, descriptor);
      },
      getOwnPropertyDescriptor: (target, key) => {
        console.log("getOwnPropertyDescriptor arguments:", target, key)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.getOwnPropertyDescriptor)) return this.#handler.getOwnPropertyDescriptor(target, key);
        return Reflect.getOwnPropertyDescriptor(target, key)
      },
      getPrototypeOf: (target) => {
        console.log("getPrototypeOf arguments:", target)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.getPrototypeOf)) return this.#handler.getPrototypeOf(target);
        return Reflect.getPrototypeOf(target);
      },
      has: (target, key) => {
        console.log("has arguments:", target, key)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.has)) return this.#handler.has(target, key);
        return key in target;
      },
      isExtensible: (target) => {
        console.log("isExtensible arguments:", target)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.isExtensible)) return this.#handler.isExtensible(target);
        return Reflect.isExtensible(target);
      },
      preventExtensions: (target) => {
        console.log("preventExtensions arguments:", target)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.preventExtensions)) return this.#handler.preventExtensions(target);
        return Reflect.preventExtensions(target);
      },
      ownKeys: (target) => {
        console.log("ownKeys arguments:", target)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.ownKeys)) return this.#handler.ownKeys(target);
        return Reflect.ownKeys(target);
      },
      setPrototypeOf: (target, prototype) => {
        console.log("setPrototypeOf arguments:", target, prototype)

        if(this.#handler && DeepProxy.#isFunction(this.#handler.setPrototypeOf)) return this.#handler.setPrototypeOf(target, prototype);
        return Object.setPrototypeOf(target, prototype);
      }
    })}
    return info.proxy;
  }

  #validateSettings() {
    let settings = this.#settings;

    if(settings.default_action === undefined) settings.default_action = true;
    if(!settings.default_action && settings.contain_function_events) settings.contain_function_events = false;
  }
 
  #checkRules(name) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_";
    const numbers = "1234567890";
    const all = chars + numbers;
    
    return chars.includes(name[0]) && name.split("").filter(char => !all.includes(char)).length === 0;
  }

  #trace(info, key) {
    let path = "";
    while(info && info.parent) {
      if(this.#checkRules(info.parentKey))
        path = info.parentKey + (path === ""? "" : `.${path}`);
      else
        path = `[${info.parentKey}]` + (path === ""? "" : `${path}`);
      info = info.parent
    }
    if(this.#checkRules(key))
      return { object: path, value: (path === ""? "" : `${path}.`) + key }
    else 
      return { object: path, value: (path === ""? "" : `${path}`) + `[${key}]` }
  }

  static Events = {
    DELETE: Symbol("DELETE"),
    GET: Symbol("GET"),
    SET: Symbol("SET"),
    FUNCTION_CALL: Symbol("FUNCTION_CALL"),
    CONSTRUCTOR_CALL: Symbol("CONSTRUCTOR_CALL"),
    CANCELED: Symbol("CANCELED"),
  }

  static #isObject(obj) {
    return typeof obj === 'object';
  }

  static #isFunction(func) {
    return typeof func === "function";
  }

  static #isSymbol(symbol) {
    return typeof symbol === "symbol";
  }

  static formatPath(path) {
    if(!(DeepProxy.#isObject(path) || typeof path === "string")) return null;
    if(DeepProxy.#isObject(path)) {
      path = {...path};
      for(let key in path) 
        if(typeof path[key] !== "string") continue;
        path[key] = path[key].replaceAll("[", ".").replaceAll("]", ".").split(".").filter(el => el !== "");
  
      return path;
    }
    return path.replaceAll("[", ".").replaceAll("]", ".").split(".").filter(el => el !== "");
  }

  get proxy() {
    return this.#proxy;
  }
}

window.DeepProxy = DeepProxy;