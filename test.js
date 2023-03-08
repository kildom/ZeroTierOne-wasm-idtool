
const fs = typeof (require) !== 'undefined' ? require('fs') : null;
const cryptoAPI = typeof (require) !== 'undefined' ? require('crypto') : crypto;

class ZerotierIdentity {

    constructor(source) {
        this.enc = new TextEncoder();
        this.dec = new TextDecoder();
        this.mod = null;
        this.memory = null;
        this.error = null;
        this.waitingPromises = [];
        let promise;
        let importObject = {
            env: {
                getVanity: (...args) => this.getVanity(...args),
                updateVanity: (...args) => this.updateVanity(...args),
                setPrivate: (...args) => this.setPrivate(...args),
                setPublic: (...args) => this.setPublic(...args),
                getRandom: (...args) => this.getRandom(...args),
            }
        };
        if ((source instanceof ArrayBuffer) || (source instanceof Uint8Array)) {
            promise = WebAssembly.instantiate(source, importObject);
        } else {
            promise = WebAssembly.instantiateStreaming(source, importObject);
        }
        promise
            .then(({ instance, module }) => {
                this.mod = instance;
                this.memory = instance.exports.memory;
                for (let p of this.waitingPromises) {
                    p[0]();
                }
            })
            .catch(err => {
                this.error = err;
                for (let p of this.waitingPromises) {
                    p[1](err);
                }
            })
    }

    async generate(vanity) {
        this.vanity = vanity;
        if (this.error !== null) {
            throw this.error;
        }
        if (this.mod === null) {
            await new Promise((resolve, reject) => this.waitingPromises.push([resolve, reject]));
        }
        this.mod.exports.main();
    }

    getVanity() {
        if (this.vanity !== undefined) {
            let buf = new Uint8Array(this.memory.buffer, 4, 1024 - 4);
            let { read, written } = this.enc.encodeInto(this.vanity, buf);
            buf[written] = 0;
            return 4;
        } else {
            return 0;
        }
    }

    addressToString(address) {
        address = address.toString(16);
        return '0'.repeat(10 - address.length) + address;
    }

    updateVanity(counter, address, bits, expected) {
        if (this.onVanityUpdate) {
            address = this.addressToString(address);
            expected = this.addressToString(expected);
            return this.onVanityUpdate(counter, address, bits, expected) ? 1 : 0;
        }
        return 0;
    }

    setPrivate(address, value_ptr, length) {
        this.private = this.decodeKey(address, value_ptr, length);
    }

    setPublic(address, value_ptr, length) {
        this.public = this.decodeKey(address, value_ptr, length);
    }

    getRandom(buf_ptr, bytes) {
        cryptoAPI.getRandomValues(new Uint8Array(this.memory.buffer, buf_ptr, bytes));
    }

    decodeKey(address, value_ptr, length) {
        let value = this.dec.decode(new Uint8Array(this.memory.buffer, value_ptr, length));
        this.address = this.addressToString(address);
        return value;
    }
}

async function main() {
    let buffer;
    if (fs) {
        buffer = fs.readFileSync('zerotier-idtool.wasm');
    } else {
        buffer = fetch('zerotier-idtool.wasm');
    }
    let id = new ZerotierIdentity(buffer);
    id.onVanityUpdate = (counter, address, bits, expected) => {
        console.log(counter, address, bits, expected);
        if (address[9] == '0') return true;
        return false;
    };
    await id.generate();
    console.log('Address', id.address);
    console.log('Public', id.public);
    console.log('Private', id.private);
    await id.generate('00');
    console.log('Address', id.address);
    console.log('Public', id.public);
    console.log('Private', id.private);
}

//main();

buffer = fetch('zerotier-idtool.wasm');
let id = new ZerotierIdentity(buffer);
let vanityCallback = null;
id.onVanityUpdate = (counter, address, bits, expected) => {
    if (vanityCallback !== null) {
        if (vanityCallback(counter, address, bits, expected)) {
            return true;
        }
    }
    this.postMessage({
        type: 'vanity',
        token: token,
        counter, address, bits, expected,
    });
};

let token = null;

let functionCache = new Map();

function functionFromMessage(data) {
    let thisObject = data.thisObject || {};
    let key = data.args.join(',') + '=>' + data.body;
    let func;
    if (functionCache.has(key)) {
        func = functionCache.get(key);
    } else {
        func = new Function(...data.args, data.body);
        functionCache.set(key, func);
    }
    thisObject.__func__ = func;
    return (...args) => thisObject.__func__(...args);
}

onmessage = async function (e) {
    let data = e.data;
    switch (data.type) {
        case 'generate':
            token = data.token;
            if (data.vanityCallback) {
                vanityCallback = functionFromMessage(data.vanityCallback);
            } else {
                vanityCallback = null;
            }
            try {
                await id.generate(data.vanity);
                this.postMessage({
                    type: 'generated',
                    token: token,
                    address: id.address,
                    public: id.public,
                    private: id.private,
                });
            } catch (err) {
                this.postMessage({
                    type: 'error',
                    token: token,
                    text: err.toString(),
                });
            }
            break;
    }
}
