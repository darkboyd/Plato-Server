import * as firebase from '../../../lib/firebase.js'
const fb = new firebase();

exports.handler = async (change, context) => {
    const rest = context.params.rest,
        ts = context.params.timestamp,
        restID = context.params.restID,
        day = context.params.hour,
        batch = fb.db.batch(),
        afterData = change.after.data()

    if (afterData && afterData.mealsReal && Object.keys(afterData.mealsReal).length > 0) {
        fb.db.doc(rest + '/' + restID + '/restGlobals/predictionParams').get().then(doc => {
            const utc = doc.data().utc,
                mealsPred = doc.data().mealsPredict;
            if (mealsPred) {
                const currTime = (Date.now()),
                    today = new Date(currTime + Number(utc)),
                    yearRef = fb.db.collection(rest + '/' + restID + '/YearlyUse'),
                    todayRef = yearRef.doc(day).collection('Days'),
                    week = new Date();
                if (today.getHours() < 5) {
                    week.setDate(week.getDate() + 6);
                } else {
                    week.setDate(week.getDate() + 7);
                }
                console.log('todayDay', day);
                console.log('weekDay', week.getDay());
                const weekString: string = `${week.getFullYear()}` + '-' + `${week.getMonth()}` + '-' + `${week.getDate()}`;
                if (week.getDay() === Number(day)) {

                    const hourRef = todayRef.doc((weekString).toString()),
                        realData = [];
                    realData[0] = {};
                    realData[1] = {};
                    realData[2] = [];
                    if ((weekString).toString() !== ts) {
                        return todayRef.orderBy('timestamp').get().then(docs => {
                            let docCounter = 0;
                            docs.forEach(docc => {
                                if (docc.id !== weekString) {
                                    const data = docc.data();
                                    const mealsReal = Object.keys(data.mealsReal),
                                        rawMaterialsReal = Object.keys(data.rawMaterialsReal);
                                    for (const meal of mealsReal) {
                                        if (realData[0][meal]) {
                                            realData[0][meal][docCounter] = data.mealsReal[meal];
                                        } else {
                                            realData[0][meal] = [];
                                            realData[0][meal][docCounter] = data.mealsReal[meal];
                                        }
                                    }
                                    for (const rawMat of rawMaterialsReal) {
                                        if (realData[1][rawMat]) {
                                            realData[1][rawMat][docCounter] = data.rawMaterialsReal[rawMat];
                                        } else {
                                            realData[1][rawMat] = [];
                                            realData[1][rawMat][docCounter] = data.rawMaterialsReal[rawMat];
                                        }
                                    }
                                    docCounter = docCounter + 1;
                                    realData[2].push(docCounter);
                                }
                            });
                            return docCounter;
                        }).then((docCounter) => {
                            console.log('realData', realData);
                            batch.set(hourRef, {
                                year: (week.getFullYear()).toString(),
                                month: (week.getMonth()).toString(),
                                date: (week.getDate().toString()),
                                timeStamp: week.getTime()
                            });
                            const keys0 = Object.keys(realData[0]),
                                keys1 = Object.keys(realData[1]);
                            for (const key of keys0) {
                                const xMinXAvg = [],
                                    yMinYAvg = [];
                                let xMultYSum = 0,
                                    xSquaredSum = 0,
                                    ySquaredSum = 0,
                                    xAvg = 0,
                                    yAvg = 0,
                                    xSum = 0,
                                    ySum = 0,
                                    r = 0,
                                    sY = 0,
                                    sX = 0,
                                    b = 0,
                                    a = 0,
                                    y = 0;

                                for (let val = 0; val < docCounter; val++) {
                                    if (realData[0][key][val]) {
                                        ySum += realData[0][key][val];
                                    }
                                    xSum += realData[2][val];
                                };
                                xAvg = xSum / docCounter;
                                yAvg = ySum / docCounter;

                                for (let val = 0; val < docCounter; val++) {
                                    if (realData[0][key][val]) {
                                        yMinYAvg[val] = realData[0][key][val] - yAvg;
                                    } else {
                                        yMinYAvg[val] = -yAvg;
                                    }
                                    xMinXAvg[val] = realData[2][val] - xAvg;
                                };

                                for (let val = 0; val < docCounter; val++) {
                                    //E(x-x^)*(y-y^) => S
                                    xMultYSum += xMinXAvg[val] * yMinYAvg[val];
                                    //E(x-x^)^2 => C
                                    xSquaredSum += Math.pow(xMinXAvg[val], 2);
                                    //E(y-y^)^2 => D
                                    ySquaredSum += Math.pow(yMinYAvg[val], 2);
                                }

                                // S / Sqrt(C*D)
                                if (ySquaredSum === 0 || xSquaredSum === 0) {
                                    r = 0;
                                } else {
                                    r = xMultYSum / (Math.sqrt((xSquaredSum * ySquaredSum)));
                                }
                                //sqrt(C / vars -1)
                                sX = Math.sqrt((xSquaredSum / (docCounter - 1)));

                                //sqrt(D / vars -1)
                                sY = Math.sqrt((ySquaredSum / (docCounter - 1)));
                                if (sX === 0) {
                                    b = 0;
                                } else {
                                    b = (r * sY) / sX;
                                }

                                a = yAvg - (b * xAvg);
                                y = a + (b * (docCounter + 1));
                                if (y < 0) {
                                    y = 0;
                                }
                                batch.set(hourRef, {
                                    mealsPred: {
                                        [key]: Math.round(y)
                                    }
                                }, {
                                    merge: true
                                });
                            }

                            for (const key of keys1) {
                                const xMinXAvg = [],
                                    yMinYAvg = [];
                                let xMultYSum = 0,
                                    xSquaredSum = 0,
                                    ySquaredSum = 0,
                                    xAvg = 0,
                                    yAvg = 0,
                                    xSum = 0,
                                    ySum = 0,
                                    r = 0,
                                    sY = 0,
                                    sX = 0,
                                    b = 0,
                                    a = 0,
                                    y = 0;

                                for (let val = 0; val < docCounter; val++) {
                                    if (realData[1][key][val]) {
                                        ySum += realData[1][key][val];
                                    }
                                    xSum += realData[2][val];
                                };
                                xAvg = xSum / docCounter;
                                yAvg = ySum / docCounter;

                                for (let val = 0; val < docCounter; val++) {
                                    if (realData[1][key][val]) {
                                        yMinYAvg[val] = realData[1][key][val] - yAvg;
                                    } else {
                                        yMinYAvg[val] = -yAvg;
                                    }
                                    xMinXAvg[val] = realData[2][val] - xAvg;
                                };

                                for (let val = 0; val < docCounter; val++) {
                                    //E(x-x^)*(y-y^) => S
                                    xMultYSum += xMinXAvg[val] * yMinYAvg[val];
                                    //E(x-x^)^2 => C
                                    xSquaredSum += Math.pow(xMinXAvg[val], 2);
                                    //E(y-y^)^2 => D
                                    ySquaredSum += Math.pow(yMinYAvg[val], 2);
                                }

                                // S / Sqrt(C*D)
                                if (ySquaredSum === 0 || xSquaredSum === 0) {
                                    r = 0;
                                } else {
                                    r = xMultYSum / (Math.sqrt((xSquaredSum * ySquaredSum)));
                                }
                                //sqrt(C / vars -1)
                                sX = Math.sqrt((xSquaredSum / (docCounter - 1)));

                                //sqrt(D / vars -1)
                                sY = Math.sqrt((ySquaredSum / (docCounter - 1)));

                                if (sX === 0) {
                                    b = 0;
                                } else {
                                    b = (r * sY) / sX;
                                }
                                a = yAvg - (b * xAvg);
                                y = a + (b * (docCounter + 1));
                                if (y < 0) {
                                    y = 0;
                                }

                                batch.set(hourRef, {
                                    rawMaterialsPred: {
                                        [key]: Math.round(y)
                                    }
                                }, {
                                    merge: true
                                });
                            }
                        }).then(() => {
                            return batch.commit().then(() => {
                                console.log('updated pred')
                            });
                        }).catch(err => {
                            return console.log(err)
                        });
                    } else {
                        console.log('change not today');
                    }
                } else {
                    console.log('day should not have changed')
                }
            } else {
                console.log('prediction set to false at ' + restID);
            }
        }).catch(err => {
            return console.log(err)
        });

    } else {
        return console.log('nothing changed')
    }
}