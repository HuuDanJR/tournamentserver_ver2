const express = require('express');
const router = express.Router();
const rankingModel = require('./model/ranking');
var path = require('path');
var fs = require('fs');

const xlsx = require('xlsx');
const chokidar = require('chokidar'); // Import the chokidar package
var multer = require('multer');
// router.route('/list_ranking').get(async (req, res) => {
//   try {
//     const data = await rankingModel.find().exec();

//     if (data == null || data.length === 0) {
//       res.status(404).json({
//         status: false,
//         message: 'No rankings found',
//         totalResult: null,
//         data: data,
//       });
//     } else {
//       res.status(200).json({
//         status: true,
//         message: 'List rankings retrieved successfully',
//         totalResult: data.length,
//         data: data,
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       status: false,
//       message: 'An error occurred while retrieving rankings',
//       error: err.message,
//     });
//   }
// });

router.route('/list_ranking').get(async (req, res) => {
  try {
    const data = await rankingModel.aggregate([
      {
        $group: {
          _id: { name: '$customer_name', number: '$customer_number' },
          data: { $first: '$$ROOT' }, // Keep the first occurrence
        },
      },
      {
        $replaceRoot: {
          newRoot: '$data',
        },
      },
    ]);

    if (data == null || data.length === 0) {
      res.status(404).json({
        status: false,
        message: 'No rankings found',
        totalResult: null,
        data: data,
      });
    } else {
      res.status(200).json({
        status: true,
        message: 'List rankings retrieved successfully (duplicates removed)',
        totalResult: data.length,
        data: data,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: 'An error occurred while retrieving rankings',
      error: err.message,
    });
  }
});



router.route('/add_ranking').post(async (req, res) => {
  try {
    // Get the data from the request body
    const { customer_name, customer_number, point, id } = req.body;

    // Create a new ranking record
    const newRanking = new rankingModel({
      customer_name: customer_name,
      customer_number: customer_number,
      point: point,
      id: id
    });

    // Save the new ranking record to the database
    const savedRanking = await newRanking.save();

    res.status(201).json({
      status: true,
      message: 'Ranking record added successfully',
      data: savedRanking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: 'An error occurred while adding the ranking record',
      error: error.message,
    });
  }
});




// //IMPORT EXCEL
const excelFilePath = path.join(__dirname, 'public', 'template_file.xlsx');
const watcher = chokidar.watch(excelFilePath);
const workbook = xlsx.readFile(excelFilePath);
const sheet_name_list = workbook.SheetNames;
watcher.on('change', async () => {
  console.log('Excel file has been changed. Reloading data...');
  // Read and process the updated Excel file
  const workbook = xlsx.readFile(excelFilePath);
  const sheet_name_list = workbook.SheetNames;
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
  // Update your data with the new content
  console.log('Data has been reloaded.');
});

router.route('/process_excel').post(async (req, res) => {
  const { fileName } = req.body; // Get the file name from the request body
  let excelFilePath = path.join(__dirname, 'public', `${fileName}.xlsx`);
  let workbook = xlsx.readFile(excelFilePath);
  let sheet_name_list = workbook.SheetNames;
  if (!fileName) {
    return res.status(400).json({ message: 'File name is required' });
  }
  let data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
  let count = 0; // Initialize a count variable
  for (const row of data) {
    const newDocument = new rankingModel({
      customer_name: row.name,
      customer_number: row.number,
      point: parseFloat(row.point),
      id: 0
    });
    console.log('new record:', newDocument);
    try {
      await newDocument.save();
      count++; // Increment the count for each successful import
    } catch (err) {
      console.error(`Error saving data: ${err}`);
    }
  }
  res.status(200).json({ message: 'Data imported successfully', count: count });
})


//Upload excel
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public'); // Specify the destination folder (e.g., "public")
  },
  filename: function (req, file, cb) {
      const extname = path.extname(file.originalname);
      const randomString = generateRandomString(6); // Generate a 6-character random string
      const newFileName = `template_file_${randomString}${extname}`;
      cb(null, newFileName); // Use the new file name
  }
});

const upload = multer({ storage: storage });
router.route('/upload_excel').post(upload.single('fileName'), async (req, res) => {
  const fileName = req.file ? req.file.filename : null;

if (!fileName) {
  return res.status(400).json({ message: 'File name is required' });
}
  // Handle the uploaded file, e.g., process it or save it to a specific location
  res.send({ message: 'Excel file uploaded successfully.', fileName: fileName });
});


// Function to generate a random string of a specified length
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}





// router.route('/upload_excel_filename').post(upload.single('fileName'), async (req, res) => {
//   const fileName = req.fileName;

//   if (!fileName) {
//     return res.status(400).json({ message: 'File name is required' });
//   }

//   const excelFilePath = path.join(__dirname, 'public', `${fileName}.xlsx`);
//   const workbook = xlsx.readFile(excelFilePath);
//   const sheet_name_list = workbook.SheetNames;

//   const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
//   let count = 0; // Initialize a count variable

//   for (const row of data) {
//     const newDocument = new rankingModel({
//       customer_name: row.name,
//       customer_number: row.number,
//       point: parseFloat(row.point),
//       id: 0
//     });

//     console.log('new record:', newDocument);

//     try {
//       await newDocument.save();
//       count++; // Increment the count for each successful import
//     } catch (err) {
//       console.error(`Error saving data: ${err}`);
//     }
//   }

//   res.status(200).json({ message: 'Data imported successfully', count: count });
// });







router.route('/update_ranking').post(async (req, res) => {
  try {
    // Get the data from the request body
    const { customer_name, customer_number, point, id } = req.body;

    // Try to find a ranking record with the same 'customer_name' and 'customer_number'
    const existingRanking = await rankingModel.findOneAndUpdate(
      { customer_name, customer_number },
      {
        customer_name,
        customer_number,
        point,
        id,
      },
      { upsert: true, new: true } // Upsert (update or insert), and return the updated or new record
    );

    res.status(200).json({
      status: true,
      message: 'Ranking record added or updated successfully',
      data: existingRanking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: 'An error occurred while adding or updating the ranking record',
      error: error.message,
    });
  }
});




module.exports = router;