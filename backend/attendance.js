const ZKLib = require('../node_zklib/zklib');
const { knex } = require('./db/sqlitedb')



function createAttendanceDB(){
    knex.schema.hasTable('attendances')
    .then((exists) => {
        if (!exists) {
            return knex.schema.createTable('attendances', (table) => {
                table.increments('id').primary();
                table.string('ip');
                table.string('name').nullable(); 
                table.string('user_id');
                table.integer('dailyCount').nullable(); // Make this column nullable
                table.datetime('recordTime');
                table.string('type');
                table.boolean('synced');
                table.boolean('closed');
                table.timestamp('created_at').defaultTo(knex.fn.now());
                table.timestamp('updated_at').defaultTo(knex.fn.now());
            })
            .then(() => console.log("Attendance table created"))
            .catch((err) => {
                console.error("Error creating table:", err);
                throw err;
            });
        } else {
            console.log("Attendance table already exists.");
        }
    })
    .catch((err) => {
        console.error("Error checking table existence:", err);
        throw err;
    });
}
function createDeviceDB() {
    // Check if the 'devices' table exists before creating it
    knex.schema.hasTable('devices')
        .then((exists) => {
            if (!exists) {
                // Create the 'devices' table
                return knex.schema.createTable('devices', (table) => {
                    table.increments('id').primary(); // Auto-increment primary key
                    table.string('machine_id').nullable(); // Physical device/machine ID
                    table.string('serial_number').nullable(); // Device Serial Number (Factory SN)
                    table.string('ip'); // IP address of the device
                    table.string('type'); // Type of the device
                    table.string('url').nullable(); // Type of the device
                    table.string('get_user_url').nullable(); // Type of the device
                    table.string('token').nullable(); // Type of the device
                    table.timestamp('created_at').defaultTo(knex.fn.now()); // Timestamp when the record is created
                    table.timestamp('updated_at').defaultTo(knex.fn.now()); // Timestamp for the last update
                })
                .then(() => console.log("Devices table created successfully."))
                .catch((err) => {
                    console.error("Error creating 'devices' table:", err);
                    throw err;
                });
            } else {
                console.log("Devices table already exists.");
                // Add machine_id column if it doesn't exist (migration)
                knex.schema.hasColumn('devices', 'machine_id')
                    .then((hasColumn) => {
                        if (!hasColumn) {
                            return knex.schema.table('devices', (table) => {
                                table.string('machine_id').nullable();
                            })
                            .then(() => console.log("Added 'machine_id' column to devices table."))
                            .catch((err) => console.error("Error adding 'machine_id' column:", err));
                        }
                    })
                    .catch((err) => console.error("Error checking for 'machine_id' column:", err));

                // Add serial_number column if it doesn't exist (migration)
                knex.schema.hasColumn('devices', 'serial_number')
                    .then((hasColumn) => {
                        if (!hasColumn) {
                            return knex.schema.table('devices', (table) => {
                                table.string('serial_number').nullable();
                            })
                            .then(() => console.log("Added 'serial_number' column to devices table."))
                            .catch((err) => console.error("Error adding 'serial_number' column:", err));
                        }
                    })
                    .catch((err) => console.error("Error checking for 'serial_number' column:", err));
            }
        })
        .catch((err) => {
            console.error("Error checking for 'devices' table existence:", err);
            throw err;
        });
}






createAttendanceDB()
createDeviceDB();




function registerAttendance(device){
    return new Promise(async(resolve,reject)=>{
        const zk = new ZKLib(device.ip, 4370, 10000, 4000);

        try {
            // Create socket to machine 
            await zk.createSocket()
    
    
            // Get general info like logCapacity, user counts, logs count
            // It's really useful to check the status of device 
            console.log(await zk.getInfo())
        } catch (e) {
            console.log('attendance connection  error ',e)
            reject('attendance connection  error ' + e)
            if (e.code === 'EADDRINUSE') {
                console.log('yeah the attendance machine port is in use')
                
            }
        }

    


        // Get all logs in the machine 
        // Currently, there is no filter to take data, it just takes all !!
        const logs = await zk.getAttendances();
        const attendance_info  = transformAttendanceData(logs)

        //register the attendance data..
        if(attendance_info){
            saveAttendanceData(attendance_info, 4)
               .then(result=>{
                    resolve(attendance_info)
               })
               .catch(err=>{
                   reject('failed to save the attendance data' + err)
               })
        }else{
           reject('Failed to register attendance data from  attendance machine')
        }
    })
}



function saveAttendanceData(attendanceItems, type) {
    return new Promise((resolve, reject) => {
        const insertPromises = attendanceItems.map(async (attendance) => {
            const newItem = {
                Name: attendance.UserId,
                // Verify the exact column name in your database
                user_id: attendance.UserId, 
                recordTime: reformatUTCDates(attendance.recordTime),
                ip: attendance.ip,
                type: type,
                dailyCount: attendance.Count,
                synced: false,
                closed: false
            };

            try {
                // Double-check column names match exactly with your database schema
                const existingRecord = await knex('attendances')
                    .where({
                        user_id: newItem.user_id,  // Use 'Name' instead of 'user_id' if that's the column name
                        recordTime: newItem.recordTime,
                        type: newItem.type
                    })
                    .first();

                if (!existingRecord) {
                    const response = await knex('attendances').insert(newItem);
                    console.log('recorded attendance item', response);
                } else {
                    console.log('Attendance record already exists');
                }
            } catch (err) {
                console.error('Failed to save attendance item', err);
                throw err;
            }
        });

        Promise.all(insertPromises)
            .then(() => resolve('saved the attendance data in system'))
            .catch(reject);
    });
}

function getAllAttendance(timePeriod){

    return new Promise((resolve,reject)=>{
        const attendanceItems = []
        // knex.from('attendances').select('*')
        //      .where('closed', false)
        //      .orderBy('created_at', 'desc').limit(2000)
        //      .then((rows) => {
        //           rows.forEach(row=>{
        //              attendanceItems.push(row)
        //           })
        //           resolve(attendanceItems)
        //       })
        //       .catch((err) => { console.log( err); reject(err) })

            //   knex.raw('select * from attendances where id = ?', [1])
            //        .then(function(resp) { /*...*/ });
            knex.raw('select a.id,a.personId,a.ip,a.dailyCount,a.recordTime,a.created_at, p.name,p.userId,p.classId from attendances a inner join persons p on a.personId = p.userId order by a.created_at desc')
                    .then(function(rows) {
                        rows.forEach(row=>{
                            attendanceItems.push(row)
                         })
                         resolve(attendanceItems)
                     })
                     .catch( (err) => {console.log(err); reject(err)})
        // .finally(() => {
        //     knex.destroy();
        // });
    })

}


//sales metrics.. top selling items
function getAttendancesByDate(input){
        
    let startDate = new Date(input.startDate), 
        endDate = new Date(input.endDate)

 return new Promise((resolve,reject)=>{
    const sales = []
    knex.from('attendances').select('*').where('closed', false) ////for now discard the sales that have closed:true in productStore.salesList
        .whereBetween('created_at', [startDate, endDate])
        .then((rows) => {
            rows.forEach(row=>{
              sales.push(row)
            })
            resolve(sales)
        })
    .catch((err) => { console.log( err); reject(err) })
    // .finally(() => {
    //     knex.destroy();
    // });
})

}



//utility functions
function reformatUTCDates(dateStr){
    const dateObj = new Date(dateStr)
    // Specify the EAT timezone offset (UTC+3)
    const eatDateString = dateObj.toLocaleString("en-US", {
        timeZone: "Africa/Nairobi", // Specify EAT timezone
        hour12: false, // Use 24-hour format
      });
    
    console.log("EAT time:", eatDateString); // Output: 2023-12-22 20:35:35
    return eatDateString
}

function transformAttendanceData(info){
    const attendanceList = []
    const dateObj = new Date().toLocaleString()
    info.data.forEach(item=>{
        attendanceList.push({
            Name: item.deviceUserId,
            Count: item.userSn,
            recordTime: reformatUTCDates(item.recordTime),
            ip: item.ip,
            deviceUserId: item.deviceUserId, // regisered userId
            dateCreated: dateObj
        })
    })

    return attendanceList;
       
}

// Fetch all devices
function getAllDevices() {
   
    

    return new Promise((resolve,reject)=>{
       const devices = []
       knex.from('devices').select('*')
           .then((rows) => {
               //console.log(rows);
               rows.forEach(row=>{
                 devices.push(row)
               })
               resolve(devices)
           })
       .catch((err) => { console.log( err); reject(err) })
       // .finally(() => {
       //     knex.destroy();
       // });
   })
   
   }    
        

// Add a new device
const addDevice = async (device) => {
    const { id, machine_id, serial_number, ip, type, url, token, get_user_url } = device;
    try {
        await knex('devices').insert({ id, machine_id, serial_number, ip, type, url, token, get_user_url });
        return 'Device added successfully.';
    } catch (err) {
        console.error('Error adding device:', err.message);
        throw err;
    }
};

// Edit an existing device
const editDevice = async (id, updatedDevice) => {
    const { machine_id, serial_number, ip, type, url, token, get_user_url } = updatedDevice;
    try {
        await knex('devices')
            .where({ id })
            .update({ machine_id, serial_number, ip, type, url, token, get_user_url });
        return 'Device updated successfully.';
    } catch (err) {
        console.error('Error editing device:', err.message);
        throw err;
    }
};

// Delete a device by id
const deleteDevice = async (id) => {
    try {
        await knex('devices').where({ id }).del();
        return 'Device deleted successfully.';
    } catch (err) {
        console.error('Error deleting device:', err.message);
        throw err;
    }
};

// Batch sync attendance records
const batchSyncAttendance = async (attendanceRecords) => {
    let successCount = 0;
    let failedCount = 0;
    const errors = [];
    const processedRecords = [];

    // Process each attendance record
    for (const record of attendanceRecords) {
        try {
            const { user_id, recordTime, ip, type, dailyCount, name } = record;

            // Validate required fields
            if (!user_id || !recordTime) {
                failedCount++;
                errors.push({
                    record,
                    error: 'Missing required fields: user_id or recordTime'
                });
                continue;
            }

            // Format the record time
            const formattedRecordTime = reformatUTCDates(recordTime);

            // Check if record already exists
            const existingRecord = await knex('attendances')
                .where({
                    user_id: user_id,
                    recordTime: formattedRecordTime,
                    type: type || 4
                })
                .first();

            if (existingRecord) {
                console.log(`Record already exists for user ${user_id} at ${formattedRecordTime}`);
                failedCount++;
                errors.push({
                    record,
                    error: 'Duplicate record - already exists'
                });
                continue;
            }

            // Insert new attendance record
            const newRecord = {
                name: name || null,
                user_id: user_id,
                recordTime: formattedRecordTime,
                ip: ip || null,
                type: type || 4,
                dailyCount: dailyCount || null,
                synced: true, // Mark as synced since it's coming from batch sync
                closed: false
            };

            const [insertedId] = await knex('attendances').insert(newRecord);

            successCount++;
            processedRecords.push({
                id: insertedId,
                user_id: user_id,
                recordTime: formattedRecordTime
            });

            console.log(`Successfully synced attendance for user ${user_id}`);

        } catch (error) {
            failedCount++;
            errors.push({
                record,
                error: error.message
            });
            console.error('Error processing attendance record:', error);
        }
    }

    return {
        success: true,
        total: attendanceRecords.length,
        successCount,
        failedCount,
        processedRecords,
        errors: errors.length > 0 ? errors : undefined
    };
};

module.exports.registerAttendance = registerAttendance
module.exports.getAttendancesByDate = getAttendancesByDate
module.exports.getAllAttendance = getAllAttendance
module.exports.saveAttendanceData = saveAttendanceData
module.exports.getAllDevices = getAllDevices
module.exports.addDevice = addDevice
module.exports.editDevice = editDevice
module.exports.deleteDevice = deleteDevice
module.exports.batchSyncAttendance = batchSyncAttendance