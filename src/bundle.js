function nativeTryCatch(fn, errorFn) {
    try {
        fn();
    }
    catch (err) {
        console.log('err', err);
        if (errorFn) {
            errorFn(err);
        }
    }
}

function isNodeEnv() {
    return Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
}
let myGlobal = null;
function getGlobal() {
    if (!myGlobal) {
        myGlobal = (isNodeEnv() ? global : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {});
    }
    return myGlobal;
}
myGlobal = getGlobal();
function getLocationHref() {
    if (typeof document === 'undefined' || document.location == null)
        return '';
    return document.location.href;
}
function addListener(target, eventName, handler, opitons = false) {
    if (typeof opitons === 'boolean') {
        return target.addEventListener(eventName, handler, opitons);
    }
    target.addEventListener(eventName, handler, opitons);
}
function replaceOld(source, name, replacement) {
    if (!(name in source))
        return;
    const original = source[name];
    const wrapped = replacement(original);
    if (typeof wrapped === 'function') {
        nativeTryCatch(() => {
            wrapped.prototype = wrapped.prototype || {};
            Object.defineProperties(wrapped, {
                __MITO__: {
                    enumerable: false,
                    value: original
                }
            });
        });
        source[name] = wrapped;
    }
}
function splitObjToQuery(obj) {
    return Object.entries(obj).reduce((result, [key, value], index) => {
        if (index !== 0) {
            result += '&';
        }
        result += `${key}=${value}`;
        return result;
    }, '');
}
const defaultFunctionName = '<anonymous>';
function getFunctionName(fn) {
    try {
        if (!fn || typeof fn !== 'function') {
            return defaultFunctionName;
        }
        return fn.name || defaultFunctionName;
    }
    catch (e) {
        return defaultFunctionName;
    }
}

function isString(wat) {
    return Object.prototype.toString.call(wat) === '[object String]';
}

const PREFIX = 'MITO Logger';
const global$1 = getGlobal();
class Logger {
    constructor(enabled) {
        this.enabled = enabled;
    }
    disable() {
        this.enabled = false;
    }
    enable() {
        this.enabled = true;
    }
    log(...args) {
        if (!this.enabled) {
            return;
        }
        global$1.console.log(`${PREFIX}[Log]: ${args.join(' ')}`);
    }
    warn(...args) {
        if (!this.enabled) {
            return;
        }
        global$1.console.warn(`${PREFIX}[Warn]: ${args.join(' ')}`);
    }
    error(...args) {
        if (!this.enabled) {
            return;
        }
        global$1.console.error(`${PREFIX}[Error]: ${args.join(' ')}`);
    }
}
global$1.__MITO__ = global$1.__MITO__ || {};
const logger = global$1.__MITO__.logger || (global$1.__MITO__.logger = new Logger(true));

function supportsHistory() {
    const global = getGlobal();
    const chrome = global.chrome;
    const isChromePackagedApp = chrome && chrome.app && chrome.app.runtime;
    const hasHistoryApi = 'history' in global && !!global.history.pushState && !!global.history.replaceState;
    return !isChromePackagedApp && hasHistoryApi;
}

const CONS = {
    ERROR_TYPES_RE: /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/,
    UNKNOWN: 'UNKNOWN',
    UNKNOWN_FUNCTION: 'UNKNOWN_FUNCTION',
    JAVASCRIPT_ERROR: 'JAVASCRIPT_ERROR',
    BUSINESS_ERROR: 'BUSINESS_ERROR',
    LOG_ERROR: 'LOG_ERROR',
    FETCH_ERROR: 'HTTP_ERROR',
    VUE_ERROR: 'VUE_ERROR',
    RESOURCE_ERROR: 'RESOURCE_ERROR',
    PROMISE_ERROR: 'PROMISE_ERROR',
    SERVER_URL: '//trycatch.qa.91jkys.com/api/error/error.gif',
    MAX_ERROR_COUNT: 3,
    LEVEL: {
        CRITICAL: 1,
        HIGH: 2,
        NORMAL: 3,
        LOW: 4
    }
};

const hasConsole = typeof console !== 'undefined';
const MitoVue = {
    install(Vue, option) {
        if (!Vue || !Vue.config)
            return;
        Vue.config.errorHandler = function (err, vm, info) {
            MitoVue.computedErrorStackError.apply(null, arguments);
            if (hasConsole) {
                console.error('Error in ' + info + ': "' + err.toString() + '"', vm);
                console.error(err);
            }
        };
        Vue.config.warnHandler = function (msg, vm, trace) {
            hasConsole && console.error('[Vue warn]: ' + msg + trace);
        };
    },
    formatComponentName(vm) {
        if (vm.$root === vm)
            return 'root';
        var name = vm._isVue ? (vm.$options && vm.$options.name) || (vm.$options && vm.$options._componentTag) : vm.name;
        return ((name ? 'component <' + name + '>' : 'anonymous component') +
            (vm._isVue && vm.$options && vm.$options.__file ? ' at ' + (vm.$options && vm.$options.__file) : ''));
    },
    computedErrorStackError(err, vm, info) {
        const componentName = MitoVue.formatComponentName(vm);
        const propsData = vm.$options && vm.$options.propsData;
        const data = {
            type: CONS.VUE_ERROR,
            message: `${err.message}(${info})`,
            level: CONS.LEVEL.HIGH,
            url: getLocationHref(),
            componentName: componentName,
            propsData: propsData || '',
            name: err.name,
            stack: err.stack || [],
            time: Date.now()
        };
        console.log(data);
    }
};

const global$2 = getGlobal();
const handlers = {};
function replace(type) {
    switch (type) {
        case 'xhr':
            xhrReplace();
            break;
        case 'fetch':
            fetchReplace();
            break;
        case 'error':
            listenError();
            break;
        case 'console':
            replaceConsole();
            break;
        case 'history':
            replaceHistory();
            break;
        case 'unhandledrejection':
            unhandledrejectionReplace();
    }
}
function addReplaceHandler(handler) {
    if (!handler) {
        return;
    }
    handlers[handler.type] = handlers[handler.type] || [];
    handlers[handler.type].push(handler.callback);
    replace(handler.type);
}
function triggerHandlers(type, data) {
    if (!type || !handlers[type])
        return;
    handlers[type].forEach((callback) => {
        nativeTryCatch(() => {
            callback(data);
        }, (e) => {
            logger.error(`重写事件triggerHandlers的回调函数发生错误\nType:${type}\nName: ${getFunctionName(callback)}\nError: ${e}`);
        });
    });
}
function xhrReplace() {
    if (!('XMLHttpRequest' in global$2)) {
        return;
    }
    const originalXhrProto = XMLHttpRequest.prototype;
    replaceOld(originalXhrProto, 'open', (originalOpen) => {
        return function (...args) {
            const url = args[1];
            this.mito_xhr = {
                method: isString(args[0]) ? args[0].toUpperCase() : args[0],
                url: args[1],
                sTime: Date.now()
            };
            if (isString(url) && this.mito_xhr.method === 'POST' && url.match(/mito_key/)) ;
            addListener(this, 'error', function () {
                this.mito_xhr.elapsedTime = Date.now() - this.mito_xhr.sTime;
                triggerHandlers('xhr', this.mito_xhr);
                logger.error(`接口错误,接口信息:${JSON.stringify(this.mito_xhr)}`);
            });
            originalOpen.apply(this, args);
        };
    });
    replaceOld(originalXhrProto, 'send', (originalSend) => {
        return function (...args) {
            addListener(this, 'loadend', function () {
                this.mito_xhr.elapsedTime = Date.now() - this.mito_xhr.sTime;
                triggerHandlers('xhr', this.mito_xhr);
            });
            originalSend.apply(this, args);
        };
    });
}
function fetchReplace() {
    if (!('fetch' in global$2)) {
        return;
    }
    replaceOld(global$2, 'fetch', (originalFetch) => {
        return function (url, config) {
            let sTime = Date.now();
            return originalFetch.apply(global$2, arguments).then((res) => {
                const tempRes = res.clone();
                const eTime = Date.now();
                const handlerData = {
                    elapsedTime: eTime - sTime,
                    type: 'fetch',
                    method: (config && config.method) || 'GET',
                    url,
                    status: tempRes.status,
                    statusText: tempRes.statusText,
                    time: eTime
                };
                tempRes.text().then((data) => {
                    handlerData.data = data;
                });
                triggerHandlers('fetch', handlerData);
                return res;
            }, (err) => {
                console.log('fetcherr', err);
                const eTime = Date.now();
                const handlerData = {
                    elapsedTime: eTime - sTime,
                    type: 'fetch',
                    method: (config && config.method) || 'GET',
                    url: url,
                    status: 0,
                    statusText: err.name + err.message,
                    time: eTime
                };
                triggerHandlers('fetch', handlerData);
                throw err;
            });
        };
    });
}
function listenError() {
    addListener(global$2, 'error', function (e) {
        triggerHandlers('error', e);
    });
}
function replaceConsole() {
    if (!('console' in global$2)) {
        return;
    }
    const logType = ['log', 'debug', 'info', 'warn', 'error', 'assert'];
    logType.forEach(function (level) {
        if (!(level in global$2.console)) {
            return;
        }
        replaceOld(global$2.console, level, function (originalConsoleLevel) {
            return function (...args) {
                if (originalConsoleLevel) {
                    originalConsoleLevel.apply(global$2.console, args);
                    triggerHandlers('console', { args, level });
                }
            };
        });
    });
}
let lastHref;
function replaceHistory() {
    if (!supportsHistory())
        return;
    const oldOnpopstate = global$2.onpopstate;
    global$2.onpopstate = function (...args) {
        const to = global$2.location.href;
        const from = lastHref;
        triggerHandlers('history', {
            from,
            to
        });
        oldOnpopstate && oldOnpopstate.apply(this, args);
    };
    function historyReplaceFn(originalHistoryFn) {
        return function (...args) {
            const url = args.length > 2 ? args[2] : undefined;
            if (url) {
                const from = lastHref;
                const to = String(url);
                lastHref = to;
                triggerHandlers('history', {
                    from,
                    to
                });
            }
            return originalHistoryFn.apply(this, args);
        };
    }
    replaceOld(global$2.history, 'pushState', historyReplaceFn);
    replaceOld(global$2.history, 'replaceState', historyReplaceFn);
}
function unhandledrejectionReplace() {
    replaceOld(global$2, 'onunhandledrejection', function (originalUnhandlerejecttion) {
        return function (...args) {
            triggerHandlers('unhandledrejection', args);
            if (originalUnhandlerejecttion) {
                return originalUnhandlerejecttion.apply(this, args);
            }
            return true;
        };
    });
}

class Queue {
    constructor() {
        this.stack = [];
        this.isFlushing = false;
        this.micro = Promise.resolve();
    }
    addFn(fn) {
        if (typeof fn !== 'function')
            return;
        this.stack.push(fn);
        if (!this.isFlushing) {
            this.isFlushing = true;
            this.micro.then(() => this.flushStack());
        }
    }
    flushStack() {
        const temp = this.stack.slice(0);
        this.stack.length = 0;
        this.isFlushing = false;
        for (let i = 0; i < temp.length; i++) {
            temp[i]();
        }
    }
}

const global$3 = getGlobal();
let TransportData = (() => {
    class TransportData {
        constructor(url) {
            this.url = url;
            this.queue = new Queue();
        }
        imgRequest(data) {
            TransportData.img.src = `${this.url}?${splitObjToQuery(data)}`;
        }
        xhrPost(data) {
            const requestFun = () => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', this.url);
                xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                xhr.onreadystatechange = () => {
                };
                xhr.send(JSON.stringify(data));
            };
            this.queue.addFn(requestFun);
        }
    }
    TransportData.img = new Image();
    return TransportData;
})();
global$3.__MITO__ = global$3.__MITO__ || {};
const transportData = global$3.__MITO__.transportData || (global$3.__MITO__.transportData = new TransportData('http://localhost:8090/parse/testPost'));

function setupReplace() {
    addReplaceHandler({
        callback: (data) => console.log('xhr', data),
        type: 'xhr'
    });
    addReplaceHandler({
        callback: (data) => console.log('fetch', data),
        type: 'fetch'
    });
    addReplaceHandler({
        callback: (error) => {
            transportData.xhrPost({ message: error.message });
            console.log('error', error);
        },
        type: 'error'
    });
    addReplaceHandler({
        callback: (data) => { },
        type: 'console'
    });
    addReplaceHandler({
        callback: (data) => {
            console.log('history', data);
        },
        type: 'history'
    });
    addReplaceHandler({
        callback: (data) => {
            console.log('unhandledrejection', data[0].reason);
        },
        type: 'unhandledrejection'
    });
}

export { MitoVue, setupReplace };
