(function (global) {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK failed to load.');
        return;
    }

    var firebaseConfig = {
        apiKey: "AIzaSyA_3XBuDhiI2p6iOxsr2S6dO_APxXdA9DI",
        authDomain: "sardchocolate-a11c3.firebaseapp.com",
        databaseURL: "https://sardchocolate-a11c3-default-rtdb.firebaseio.com",
        projectId: "sardchocolate-a11c3",
        storageBucket: "sardchocolate-a11c3.firebasestorage.app",
        messagingSenderId: "983073085026",
        appId: "1:983073085026:web:8492ae302b7a6ee3b3e33b",
        measurementId: "G-2YYWSDMBY9"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    var rtdb = firebase.database();
    var PROJECT_ID = 'sardchocolate';

    // Sentinel for FieldValue.increment
    function IncrementValue(n) { this._inc = n; }
    // Sentinel for serverTimestamp
    function ServerTimestamp() {}

    // Helper: convert RTDB snapshot to Firestore-like doc
    function makeDoc(key, val) {
        return {
            id: key,
            exists: val !== null && val !== undefined,
            data: function () { return val || {}; },
            ref: { id: key, path: key }
        };
    }

    // Helper: convert RTDB snapshot (object of children) to Firestore-like query snapshot
    function makeQuerySnapshot(rtdbSnap) {
        var docs = [];
        var val = rtdbSnap.val();
        if (val && typeof val === 'object') {
            Object.keys(val).forEach(function (key) {
                docs.push(makeDoc(key, val[key]));
            });
        }
        return {
            docs: docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: function (cb) { docs.forEach(cb); }
        };
    }

    // QueryRef mimics Firestore query/collection reference
    function QueryRef(path, constraints) {
        this._path = path;
        this._constraints = constraints || {};
    }

    QueryRef.prototype.orderBy = function (field, direction) {
        var c = Object.assign({}, this._constraints);
        c.orderByField = field;
        c.orderDirection = direction || 'asc';
        return new QueryRef(this._path, c);
    };

    QueryRef.prototype.limit = function (n) {
        var c = Object.assign({}, this._constraints);
        c.limitCount = n;
        return new QueryRef(this._path, c);
    };

    QueryRef.prototype.where = function (field, op, value) {
        var c = Object.assign({}, this._constraints);
        if (!c.filters) c.filters = [];
        c.filters.push({ field: field, op: op, value: value });
        return new QueryRef(this._path, c);
    };

    QueryRef.prototype._buildRef = function () {
        var ref = rtdb.ref(this._path);
        if (this._constraints.orderByField) {
            ref = ref.orderByChild(this._constraints.orderByField);
        }
        if (this._constraints.limitCount) {
            ref = ref.limitToFirst(this._constraints.limitCount);
        }
        return ref;
    };

    QueryRef.prototype._applyClientFilters = function (snapshot) {
        var qs = makeQuerySnapshot(snapshot);
        var filters = this._constraints.filters;
        if (filters && filters.length > 0) {
            qs.docs = qs.docs.filter(function (doc) {
                var data = doc.data();
                return filters.every(function (f) {
                    var val = data[f.field];
                    switch (f.op) {
                        case '==': return val === f.value;
                        case '!=': return val !== f.value;
                        case '>': return val > f.value;
                        case '>=': return val >= f.value;
                        case '<': return val < f.value;
                        case '<=': return val <= f.value;
                        case 'array-contains': return Array.isArray(val) && val.indexOf(f.value) !== -1;
                        default: return true;
                    }
                });
            });
            qs.empty = qs.docs.length === 0;
            qs.size = qs.docs.length;
        }
        // Sort by direction if specified
        if (this._constraints.orderByField) {
            var field = this._constraints.orderByField;
            var desc = this._constraints.orderDirection === 'desc';
            qs.docs.sort(function (a, b) {
                var av = a.data()[field], bv = b.data()[field];
                if (av < bv) return desc ? 1 : -1;
                if (av > bv) return desc ? -1 : 1;
                return 0;
            });
        }
        if (this._constraints.limitCount) {
            qs.docs = qs.docs.slice(0, this._constraints.limitCount);
            qs.empty = qs.docs.length === 0;
            qs.size = qs.docs.length;
        }
        return qs;
    };

    QueryRef.prototype.get = function () {
        var self = this;
        return rtdb.ref(this._path).once('value').then(function (snapshot) {
            return self._applyClientFilters(snapshot);
        });
    };

    QueryRef.prototype.onSnapshot = function (successCb, errorCb) {
        var self = this;
        var ref = rtdb.ref(this._path);
        var handler = function (snapshot) {
            var qs = self._applyClientFilters(snapshot);
            successCb(qs);
        };
        ref.on('value', handler, function (err) {
            if (errorCb) errorCb(err);
        });
        // Return unsubscribe function
        return function () { ref.off('value', handler); };
    };

    QueryRef.prototype.add = function (data) {
        var ref = rtdb.ref(this._path).push();
        return ref.set(data).then(function () {
            return { id: ref.key };
        });
    };

    QueryRef.prototype.doc = function (id) {
        return new DocRef(this._path + '/' + id);
    };

    // DocRef mimics Firestore document reference
    function DocRef(path) {
        this._path = path;
        this.id = path.split('/').pop();
        this.path = path;
    }

    DocRef.prototype.get = function () {
        var self = this;
        return rtdb.ref(this._path).once('value').then(function (snapshot) {
            return makeDoc(self.id, snapshot.val());
        });
    };

    DocRef.prototype.set = function (data, options) {
        // Handle serverTimestamp sentinels
        var cleanData = JSON.parse(JSON.stringify(data, function (key, val) {
            if (val instanceof ServerTimestamp) return Date.now();
            return val;
        }));
        if (options && options.merge) {
            return rtdb.ref(this._path).update(cleanData);
        }
        return rtdb.ref(this._path).set(cleanData);
    };

    DocRef.prototype.update = function (data) {
        var self = this;
        // Handle FieldValue.increment sentinels
        var hasIncrements = false;
        var incrementKeys = {};
        Object.keys(data).forEach(function (key) {
            if (data[key] instanceof IncrementValue) {
                hasIncrements = true;
                incrementKeys[key] = data[key]._inc;
            }
        });
        if (hasIncrements) {
            return rtdb.ref(self._path).transaction(function (current) {
                if (!current) current = {};
                Object.keys(data).forEach(function (key) {
                    if (data[key] instanceof IncrementValue) {
                        current[key] = (current[key] || 0) + data[key]._inc;
                    } else {
                        current[key] = data[key];
                    }
                });
                return current;
            });
        }
        return rtdb.ref(this._path).update(data);
    };

    DocRef.prototype.delete = function () {
        return rtdb.ref(this._path).remove();
    };

    DocRef.prototype.onSnapshot = function (successCb, errorCb) {
        var self = this;
        var ref = rtdb.ref(this._path);
        var handler = function (snapshot) {
            var doc = makeDoc(self.id, snapshot.val());
            successCb(doc);
        };
        ref.on('value', handler, function (err) {
            if (errorCb) errorCb(err);
        });
        return function () { ref.off('value', handler); };
    };

    DocRef.prototype.collection = function (name) {
        return new QueryRef(this._path + '/' + name);
    };

    // Batch mimics Firestore batch
    function Batch() {
        this._ops = [];
    }

    Batch.prototype.set = function (docRef, data, options) {
        this._ops.push({ type: 'set', path: docRef._path || docRef.path, data: data, options: options });
    };

    Batch.prototype.update = function (docRef, data) {
        this._ops.push({ type: 'update', path: docRef._path || docRef.path, data: data });
    };

    Batch.prototype.delete = function (docRef) {
        this._ops.push({ type: 'delete', path: docRef._path || docRef.path });
    };

    Batch.prototype.commit = function () {
        var updates = {};
        this._ops.forEach(function (op) {
            if (op.type === 'delete') {
                updates[op.path] = null;
            } else if (op.type === 'set') {
                // For set, we flatten into multi-path update
                var cleanData = JSON.parse(JSON.stringify(op.data, function (key, val) {
                    if (val instanceof ServerTimestamp) return Date.now();
                    return val;
                }));
                updates[op.path] = cleanData;
            } else if (op.type === 'update') {
                // For update, we set individual fields
                Object.keys(op.data).forEach(function (key) {
                    updates[op.path + '/' + key] = op.data[key];
                });
            }
        });
        return rtdb.ref().update(updates);
    };

    // db wrapper (Firestore-compatible API using RTDB)
    var db = {
        collection: function (name) {
            return new QueryRef(name);
        },
        batch: function () {
            return new Batch();
        },
        runTransaction: function (fn) {
            // Simple transaction support - pass a transaction-like object
            console.warn('runTransaction is not fully supported with RTDB wrapper');
            return Promise.resolve();
        }
    };

    // FieldValue compatibility
    var FieldValue = {
        increment: function (n) { return new IncrementValue(n); },
        serverTimestamp: function () { return new ServerTimestamp(); },
        delete: function () { return null; }
    };

    var Timestamp = {
        now: function () { return { toMillis: function () { return Date.now(); } }; },
        fromDate: function (d) { return { toMillis: function () { return d.getTime(); } }; }
    };

    global.firebaseConfig = firebaseConfig;
    global.db = db;
    global.rawDb = rtdb;
    global.PROJECT_ID = PROJECT_ID;
    global.dimaFirebase = {
        app: firebase.app(),
        db: db,
        rawDb: rtdb,
        FieldValue: FieldValue,
        Timestamp: Timestamp,
        collection: function (name) {
            return new QueryRef(name);
        }
    };

    // Patch firebase.firestore.FieldValue for code that references it directly
    if (!firebase.firestore) {
        firebase.firestore = { FieldValue: FieldValue, Timestamp: Timestamp };
    } else {
        firebase.firestore.FieldValue = FieldValue;
        firebase.firestore.Timestamp = Timestamp;
    }
})(window);
