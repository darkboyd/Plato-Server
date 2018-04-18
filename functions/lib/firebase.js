"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("../node_modules/firebase-functions/lib/index");
const admin = require("../node_modules/firebase-admin/lib/index");
admin.initializeApp();
const db = admin.firestore();
class FirebaseInitialize {
    constructor() {
        this.functions = functions;
        this.admin = admin;
        this.db = db;
    }
    // read document and returns it values
    // return null if problem occur
    getDoc(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const docRef = this.db.doc(path);
                let val;
                yield docRef.get().then(function (doc) {
                    if (doc) {
                        const myData = doc.data();
                        val = myData;
                    }
                    else {
                        val = null;
                    }
                });
                return val;
            }
            catch (err) {
                console.log(err);
                return null;
            }
        });
    }
    getCol(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const docRef = this.db.collection(path);
                let val;
                yield docRef.get().then(function (docs) {
                    if (docs) {
                        val = docs;
                    }
                    else {
                        val = null;
                    }
                });
                return val;
            }
            catch (err) {
                console.log(err);
                return null;
            }
        });
    }
}
module.exports = FirebaseInitialize;
//# sourceMappingURL=firebase.js.map