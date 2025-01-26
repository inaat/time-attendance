const ZKLib = require('../node_zklib/zklib');
const { getAllDevices } = require('../backend/attendance');
const { knex } = require('./db/sqlitedb');

// Create the attendance table if it doesn't exist
knex.schema.hasTable('attendance').then((exists) => {
    if (!exists) {
        return knex.schema.createTable('attendance', (table) => {
            table.increments('id').primary();
            table.string('deviceIp');
            table.string('userId');
            table.string('date');
            table.string('time');
        });
    }
}).then(() => {
    console.log('Attendance table is ready.');
}).catch((err) => {
    console.error('Failed to create attendance table:', err);
});

// Function to start real-time monitoring
const startRealtimeMonitoring = async (devices) => {
    for (const device of devices) {
        const zkInstance = new ZKLib(device.ip, 4370, 10000, 4000, 0);

        try {
            console.log(`Connecting to device ${device.ip}...`);
            await zkInstance.createSocket();
            console.log(`Connected to device ${device.ip}!`);

            // Register real-time event listener
            zkInstance.getRealTimeLogs(async (err, data) => {
                if (err) {
                    console.error(`Error in real-time logs for ${device.ip}:`, err);
                    return;
                }

                // Format the attendance data
                const formattedLog = {
                    deviceIp: device.ip,
                    userId: data.userId,
                    date: new Date(data.attTime).toISOString().split('T')[0], // YYYY-MM-DD
                    time: new Date(data.attTime).toTimeString().split(' ')[0], // HH:MM:SS
                };

                // Insert the attendance log into the database
                knex('attendance').insert(formattedLog)
                    .then(() => {
                        console.log('Attendance log saved:', formattedLog);
                    })
                    .catch((err) => {
                        console.error('Failed to insert attendance log:', err);
                    });
            });
        } catch (error) {
            console.error(`Connection error for ${device.ip}:`, error);
        }
    }
};

// Fetch devices and start monitoring
const init = async () => {
    try {
        const devices = await getAllDevices();
        if (devices.length > 0) {
            console.log('Starting real-time monitoring...');
            await startRealtimeMonitoring(devices);
        } else {
            console.log('No devices found.');
        }
    } catch (error) {
        console.error('Failed to initialize monitoring:', error);
    }
};

// Start the service if this script is run directly
if (require.main === module) {
    init();
}

// Export the init function for use in Electron
module.exports = { init };