const connection = require('./dbconfig_mysql');
const rankingModel = require('./model/ranking')


function hasChangesInList(inputList) {
  let previousItem = null;
  for (const item of inputList) {
    if (previousItem !== null && previousItem !== item) {
      return true;
    }
    previousItem = item;
  }
  return false;
}



// async function findListRankingSocket(eventName,io,isInit) {
//   let defaultPoint = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//   let defaultPoint2 = [20, 20, 20, 20, 20, 20, 20, 20, 20, 20];
//     try {
//       const data = await rankingModel.find().sort({ point: -1 }).limit(10).exec();

//       if (data == null || data.length === 0) {
//         console.log('findListRankingSocket: No Data')
//       } else {
//         const formattedData = data.map(item => ({
//           data: item.point,
//           name: item.customer_name,
//           number: item.customer_number,
//         }));


//         const defaultData = formattedData.map(item => item.data);
//         let resultData = [defaultPoint, defaultData];

//         const myData = {
//           data: resultData,
//           name: formattedData.map(item => item.name),
//           number: formattedData.map(item => item.number),
//         }

//         // console.log('findListRankingSocket Data:',myData)
//         if (isInit == true) {
//           io.emit(eventName, myData);
//           console.log('init data:',resultData)
//         }
//         else{
//           io.emit(eventName, myData);
//           console.log('NOT init data:',resultData)
//         }
//         // io.emit(eventName, myData);
//         // if (areArraysEqual(defaultPoint,defaultData)) {
//         //   console.log('data change')
//         //   io.emit(eventName,myData);
//         //   defaultPoint = defaultData;
//         // }else{
//         //   console.log('no data change')
//         // }
//         }

//     } catch (err) {
//       console.error(err);
//       console.log('findListRankingSocket: An Error Orcur')
//     }
//   }


const defaultPoint = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let lastData = []; // Store the last retrieved data
async function findListRankingSocket(eventName, io, isInit) {
  try {
    const data = await rankingModel.find().sort({ point: -1 }).limit(10).exec();
    if (data == null || data.length === 0) {
      console.log('findListRankingSocket: No Data')
    } else {
      const formattedData = data.map(item => ({
        data: item.point,
        name: item.customer_name,
        number: item.customer_number,
      }));
      const dataFind = formattedData.map(item => item.data);
      let dataResult = [defaultPoint, dataFind.map(item => item / 2), dataFind];
      let myData = {
        data: dataResult,
        name: formattedData.map(item => item.name),
        number: formattedData.map(item => item.number),
      }
      if (isInit == true) {

        // console.log('findListRankingSocket init data', dataFind)
        lastData = dataFind; // Store the initial data

        io.emit(eventName, myData);
      } else {
        if (areListsDifferent(lastData, dataFind)) {
          console.log('Data has changed. Emitting new data.',dataFind);
          lastData = dataFind; // Update the last data
          io.emit(eventName, myData);
        }
      }
    }
  } catch (err) {
    console.error(err);
    console.log('findListRankingSocket: An Error Orcur')
  }
}




async function findListRankingSocketAll(eventName, io) {
  try {
    const data = await rankingModel.find().exec();

    if (data == null || data.length === 0) {
      console.log('findListRankingSocketAll: No Data')
    } else {
      console.log('findListRankingSocketAll Data:', data)
      io.emit(eventName, data);
    }
  } catch (err) {
    console.error(err);
    console.log('findListRankingSocketAll: An Error Orcur')
  }
}



function findStationDataSocketWName(name, io) {
  let query = `SELECT * FROM stationdata WHERE connect = 1 ORDER BY credit DESC LIMIT 10`;
  connection.query(query, function (err, result, fields) {
    if (err) {
      console.log(err);
      // Handle any error if needed
    } else {
      // Emit the result back to the client using the 'stationData' event
      // console.log(result.length);
      // console.log('*find station data*',result)
      io.emit(name, result);
    }
  });
}
// function findDataSocket(name,io) {
//     let query = `SELECT credit FROM stationdata WHERE connect = 1 ORDER BY credit DESC LIMIT 10`;
//     connection.query(query, function (err, result, fields) {
//         if (err) {
//             console.log(err);
//             // Handle any error if needed
//         } else {
//             // Emit the result back to the client using the 'stationData' event
//             // console.log(result.length);
//             // console.log('*find station data*',result)
//             const credits = result.map(item => item.credit);
//             const credits_default = [0.0, 10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0];


//             // Create the desired result format
//             const desiredResult = [credits_default,credits];
//             // console.log(desiredResult)
//             io.emit(name, desiredResult);
//         }
//     });
// }
// let oldCredits = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
// let example1 = [41.234577922020044, 64.38432290590475, 47.75018798285104,
//   11.937303150292324, 41.427926533058525, 68.06658632196081, 101.61874831295057, 32.43647135955468, 83.94904467049842,
//   107.46842634250395];
// function findDataSocket(name, io) {
//   let query = `SELECT credit FROM stationdata WHERE connect = 1 ORDER BY credit DESC LIMIT 10`;
//   connection.query(query, function (err, result, fields) {
//     if (err) {
//       console.log(err);
//       // Handle any error if needed
//     }
//     else {
//       // Extract new credits from the result
//       const newCredits = result.map(item => item.credit);

//       // Check if the new credits are different from the old credits
//       if (!areArraysEqual(oldCredits, newCredits)) {
//         // Emit the result back to the client using the 'stationData' event
//         io.emit(name, [oldCredits, example1, newCredits]);
//         // Update oldCredits for the next run
//         oldCredits = newCredits;
//       }
//       // io.emit(name, [oldCredits,example1, newCredits]);

//     }
//   });
// }
let oldCredits = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
const defaultData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function findDataSocketFull(name, io, isInit) {
  // let query = `SELECT credit, member FROM stationdata WHERE connect = 1 ORDER BY credit`;
  let query = `SELECT credit, ip,member FROM stationdata WHERE connect = 1 ORDER BY credit DESC  LIMIT 10`;
  connection.query(query, function (err, result, fields) {
    if (err) {
      console.log(err);
    } else {
      
      const newCredits = result.map(item => parseFloat(item.credit) / 100);
      const ips = result.map(item => parseInt(item.ip, 10));
      const member = result.map(item => (item.member));
      console.log('findDataSocketFull data: ',result);
      console.log('ips',ips);
      console.log('members',member);
      
      
      let randomdata = generateGoodRandomData(5, 10);
      // console.log(randomdata)
      if (isInit == true) {
        // io.emit(name, [ips, oldCredits, newCredits]);
        // const fullDAta =[member, [ips, oldCredits, newCredits]]
        // console.log('full data',fullDAta)
        io.emit(name,member, [ips, oldCredits, newCredits]);
        // console.log('init data:',newCredits)
      }
      if (!areArraysEqual(oldCredits, newCredits)) {
        // console.log('data change')
        // io.emit(name, [ips, oldCredits, newCredits]);
        io.emit(name,member, [ips, oldCredits, newCredits]);
        oldCredits = newCredits;
        // console.log('init data:',newCredits)
      }
      else {
        oldCredits = newCredits;
      }
      //  io.emit(name, [members, randomdata, newCredits]);

    }
  });
}
function generateGoodRandomData(nbRows, nbColumns) {
  const data = [];

  for (let i = 0; i < nbRows; i++) {
    data[i] = new Array(nbColumns).fill(0);
  }

  for (let j = 0; j < nbColumns; j++) {
    data[0][j] = j * 10.0;
  }

  for (let i = 1; i < nbRows; i++) {
    for (let j = 0; j < nbColumns; j++) {
      const calculatedValue =
        data[i - 1][j] +
        (nbColumns - j) +
        Math.random() * 20 +
        (j === 2 ? 10 : 0);
      data[i][j] = calculatedValue;
      // console.log('calculate value: ' + calculatedValue);
    }
  }
  // console.log(data);
  return data;
}



function areListsDifferent(list1, list2) {
  // Check if the lengths of the lists are different
  if (list1.length !== list2.length) {
    return true;
  }

  // Iterate through the items in the lists and compare them
  for (let i = 0; i < list1.length; i++) {
    // Use Number.EPSILON to handle potential floating-point precision issues
    if (Math.abs(list1[i] - list2[i]) > Number.EPSILON) {
      return true;
    }
  }

  // If no differing items are found, return false
  return false;
}


function areArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}



//SELECT CREDIT AND NUMBER 






function deleteStationDataSocketWName(name, io, ip) {
  let query = `DELETE FROM stationdata WHERE ip = ?`;
  connection.query(query, [ip], function (err, result, fields) {
    if (err) {
      console.log(err);
      // Handle any error if needed
    } else {
      console.log(result);
      // Emit the result back to the client using the specified event name
      io.emit(name, result);
    }
  });
}




function addStationDataSocketWName(name, io, machine, member, bet, credit, connect, status, aft, lastupdate) {
  const query = `INSERT INTO stationdata (machine, member, bet, credit, connect, status, aft, lastupdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [machine, member, bet, credit, connect, status, aft, lastupdate];
  connection.query(query, values, function (err, result, fields) {
    if (err) {
      console.log(err);
      // Handle any error if needed
    } else {

      // console.log(result);
      // Emit the result back to the client using the specified event name
      io.emit(name, result);
    }
  });
}

module.exports = {
  findStationDataSocketWName: findStationDataSocketWName,
  deleteStationDataSocketWName: deleteStationDataSocketWName,
  addStationDataSocketWName: addStationDataSocketWName,
  // findDataSocket: findDataSocket,
  findDataSocketFull: findDataSocketFull,
  findListRankingSocket: findListRankingSocket,
  findListRankingSocketAll: findListRankingSocketAll,
}