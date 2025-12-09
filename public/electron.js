const { app, BrowserWindow, Menu, shell, ipcMain, globalShortcut, dialog, nativeImage, Tray } = require('electron');
const axios = require('axios');

const ZKLib = require('../node_zklib/zklib');
const path = require('path');
const isDev = !app.isPackaged;

const {
  getAllDevices,
  addDevice,
  editDevice,
  deleteDevice, saveAttendanceData
} = require('../backend/attendance');
const { Console } = require('console');

let mainWindow;
let tray;
let focusBooster;

// Store active ZKLib instances for each device
const activeZKInstances = {};
async function initializeBackgroundMonitoring() {
  try {
    // Fetch all configured devices
    const devices = await getAllDevices();
    
    // Start real-time monitoring for all devices
    if (devices && devices.length > 0) {
      await startRealtimeMonitoring(devices);
      console.log(`Started background monitoring for ${devices.length} devices`);
    } else {
      console.log('No devices configured for monitoring');
    }
  } catch (error) {
    console.error('Background monitoring initialization failed:', error);
  }
}
// Store user maps for each device
const deviceUserMaps = {};

// Function to start real-time monitoring
const startRealtimeMonitoring = async (devices) => {
  for (let index = 0; index < devices.length; index++) {
    const device = devices[index];
    const zkInstance = new ZKLib(device.ip, 4370, 10000, 4000, 0);

    // Store the instance for later cleanup
    activeZKInstances[device.ip] = zkInstance;

    try {
      console.log(`Trying to connect to ${device.ip}...`);
      await zkInstance.createSocket();
      console.log(`Connection established with ${device.ip}!`);

      // Fetch users once to get names
      try {
        const users = await zkInstance.getUsers();
        const userMap = {};
        if (users && users.data && Array.isArray(users.data)) {
          users.data.forEach(user => {
            userMap[user.userId] = user.name || user.userId;
          });
        }
        deviceUserMaps[device.ip] = userMap;
        console.log(`Fetched ${Object.keys(userMap).length} users for ${device.ip}`);
      } catch (userError) {
        console.error(`Failed to fetch users for ${device.ip}:`, userError);
        deviceUserMaps[device.ip] = {};
      }

      // Register real-time event listener
      zkInstance.getRealTimeLogs(async (err, data) => {
        if (err) {
          console.error(`Error in registering real-time event for ${device.ip}:`, err);
          return;
        }

        console.log('Attendance From: ', zkInstance.ip);
        console.log({ Attendance: data });

        // Get user name from the map
        const userName = deviceUserMaps[device.ip][data.userId] || data.userId;

        // Prepare the formatted log
        const formattedLog = {
          deviceIp: device.ip,
          userId: data.userId,
          name: userName,
          date: new Date(data.attTime).toISOString().split('T')[0],
          time: new Date(data.attTime).toTimeString().split(' ')[0],
        };

        try {
          if(device.type==='staff'){
          // Send data to the API endpoint
          const response = await axios.post(device.url, {
            employee_id: data.userId,
            token: device.token,
            date: `${formattedLog.date} ${formattedLog.time}`,
            machine_id: device.machine_id,
            serial_number: device.serial_number
          });


          console.log(`API Response for ${device.ip}  , ${device.url}:`, response.data);
        }else{
          // Send data to the API endpoint
          const response = await axios.post(device.url, {
            student_id: data.userId,
            token: device.token,
            date: `${formattedLog.date} ${formattedLog.time}`,
            machine_id: device.machine_id,
            serial_number: device.serial_number
          });


          console.log(`API Response for ${device.ip}  , ${device.url}:`, response.data);
        }
        } catch (apiError) {
          console.error(`API call failed for ${device.ip},${device.url}:`, apiError.message);
        }

        mainWindow.webContents.send('realtime-attendance', formattedLog);

      });
    } catch (error) {
      console.error(`Connection error for ${device.ip}:`, error);
    }
  }
}


// Function to stop real-time monitoring and disconnect all devices
const stopRealtimeMonitoring = async () => {
  for (const ip in activeZKInstances) {
    const zkInstance = activeZKInstances[ip];
    if (zkInstance) {
      try {
        console.log(`Disconnecting from ${ip}...`);
        await zkInstance.disconnect();
        console.log(`Disconnected from ${ip}!`);
      } catch (error) {
        console.error(`Error disconnecting from ${ip}:`, error);
      }
    }
  }

  Object.keys(activeZKInstances).forEach((ip) => {
    delete activeZKInstances[ip];
  });
};

// Create the main application window
function createWindow() {
  const image = nativeImage.createFromPath('favicon.png');
  image.setTemplateImage(true);

  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: image,
  });

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/index.html')}`);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.setMenu(null);
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

// Create system tray icon
function createTrayIcon() {
  const iconPath = path.join(__dirname, 'trayicon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Exit',
      click: () => {
        stopRealtimeMonitoring().then(() => app.quit());
      }
    }
  ]);

  tray.setToolTip('Attendance Monitoring');
  tray.setContextMenu(contextMenu);
}

// Create hidden focus booster window (for keyboard focus fix)
function createFocusBooster() {
  focusBooster = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    frame: false,
    skipTaskbar: true,
    transparent: true,
    x: -100, // Off-screen position
    y: -100
  });
}

// IPC Handlers for Device Management
ipcMain.handle('start-realtime-monitoring', async (event, devices) => {
  await startRealtimeMonitoring(devices);
});

ipcMain.handle('stop-realtime-monitoring', async () => {
  await stopRealtimeMonitoring();
});

ipcMain.handle('fetch-all-devices', async (event) => {
  try {
    const devices = await getAllDevices();
    return devices;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
});

// Test Device Connection
ipcMain.handle('test-device-connection', async (event, device) => {
  try {
    const zk = new ZKLib(device.ip, 4370, 10000, 4000);
    await zk.createSocket();
    const CMD_TESTVOICE = 1017;
    const result = await zk.executeCmd(CMD_TESTVOICE, '');
    console.log('Voice test command result:', result);
    await zk.disconnect();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get Device Info (Serial Number, etc.)
ipcMain.handle('get-device-info', async (event, device) => {
  try {
    const zk = new ZKLib(device.ip, 4370, 10000, 4000);
    await zk.createSocket();

    // Get basic info (user counts, log counts, etc.)
    const deviceInfo = await zk.getInfo();
    console.log('Device Info:', deviceInfo);

    // Get Serial Number using CMD_OPTIONS_RRQ
    let serialNumber = null;
    try {
      const CMD_OPTIONS_RRQ = 11;
      const snBuffer = await zk.executeCmd(CMD_OPTIONS_RRQ, '~SerialNumber');
      const snString = snBuffer.toString('ascii');
      console.log('Serial Number response:', snString);

      // Parse serial number from response (format: "~SerialNumber=XXX\x00")
      if (snString.includes('~SerialNumber=')) {
        serialNumber = snString.split('~SerialNumber=')[1].split('\x00')[0].trim();
      }
    } catch (snError) {
      console.error('Failed to get serial number:', snError.message);
    }

    // Try alternative serial number command if first attempt failed
    if (!serialNumber) {
      try {
        const snBuffer = await zk.executeCmd(11, 'SerialNumber');
        const snString = snBuffer.toString('ascii');
        if (snString.includes('SerialNumber=')) {
          serialNumber = snString.split('SerialNumber=')[1].split('\x00')[0].trim();
        }
      } catch (err) {
        console.error('Alternative serial number fetch failed:', err.message);
      }
    }

    await zk.disconnect();

    return {
      success: true,
      info: deviceInfo,
      serialNumber: serialNumber
    };
  } catch (error) {
    console.error('Failed to get device info:', error);
    return { success: false, error: error.message };
  }
});

// Fetch Attendance from Device
ipcMain.handle('fetch-attendance-from-device', async (event, device) => {
  try {
    const zk = new ZKLib(device.ip, 4370, 10000, 4000);
    await zk.createSocket();
    await zk.enableDevice();

    // First, fetch users to get names
    const users = await zk.getUsers();
    const userMap = {};

    // Create a map of userId -> userName for quick lookup
    if (users && users.data && Array.isArray(users.data)) {
      users.data.forEach(user => {
        userMap[user.userId] = user.name || user.userId;
      });
    }

    // Then fetch attendance logs
    const attendanceLogs = await zk.getAttendances();
    await zk.disableDevice();
    await zk.disconnect();

    if (!Array.isArray(attendanceLogs.data)) {
      throw new Error('Invalid attendance data format: expected an array');
    }

    // Map attendance with actual user names
    const attendanceList = attendanceLogs.data.map((item) => ({
      Name: userMap[item.deviceUserId] || item.deviceUserId, // Use name from user list, fallback to userId
      Count: item.userSn,
      recordTime: item.recordTime,
      ip: item.ip,
      UserId: item.deviceUserId,
    }));

    //saveAttendanceData(attendanceList,'staff');
    return {
      success: true,
      data: attendanceList,
    };
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return {
      success: false,
      message: error.message,
    };
  }
});

// Fetch Users from Device
ipcMain.handle('fetch-users-from-device', async (event, device) => {
  try {
    const zk = new ZKLib(device.ip, 4370, 10000, 4000);
    await zk.createSocket();
    await zk.enableDevice();
    const users = await zk.getUsers();
    await zk.disableDevice();
    await zk.disconnect();
    return users;
  } catch (error) {
    console.error('Error fetching users from device:', error);
    throw error;
  }
});

// Update User on Device
ipcMain.handle('update-user-on-device', async (event, { device, user }) => {
  try {
    const zk = new ZKLib(device.ip, 4370, 10000, 4000);
    await zk.createSocket();
    await zk.enableDevice();
    const sanitizedUser = {
      uid: Number(user.uid) || 0,
      userId: String(user.userId || ''),
      name: String(user.name || ''),
      cardno: String(user.cardno || ''),
      role: Number(user.role) || 0,
    };
    await zk.setUser(sanitizedUser.name, '', sanitizedUser.uid, sanitizedUser.userId);
    await zk.disableDevice();
    await zk.disconnect();
    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    console.error('Failed to update user:', error.message);
    return { success: false, message: error.message };
  }
});

// Add User to Device
ipcMain.handle('add-user-to-device', async (event, { device, user }) => {
  try {
    const zk = new ZKLib(device.ip, 4370, 10000, 4000);
    await zk.createSocket();
    await zk.enableDevice();
    const sanitizedUser = {
      uid: Number(user.uid) || 0,
      userId: String(user.userId || ''),
      name: String(user.name || ''),
      cardno: String(user.cardno || ''),
      role: Number(user.role) || 0,
    };
    await zk.setUser(sanitizedUser.name, '', sanitizedUser.uid, sanitizedUser.userId);
    await zk.disableDevice();
    await zk.disconnect();
    return { success: true, message: 'User added successfully' };
  } catch (error) {
    console.error('Failed to add user:', error.message);
    return { success: false, message: error.message };
  }
});

// Delete User from Device
ipcMain.handle('delete-user-from-device', async (event, { device, uid }) => {
  try {
    const zk = new ZKLib(device.ip, 4370, 10000, 4000);
    await zk.createSocket();
    await zk.enableDevice();
    await zk.deleteUser(uid);
    await zk.disableDevice();
    await zk.disconnect();
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Failed to delete user:', error.message);
    return { success: false, message: error.message };
  }
});
// ClearAttendanceLog
ipcMain.handle('clear-attendance-log', async (event, { device }) => {
  try {
    const zk = new ZKLib(device.ip, 4370, 10000, 4000);
    await zk.createSocket();
    await zk.enableDevice();
    await zk.clearAttendanceLog();
    await zk.disableDevice();
    await zk.disconnect();
    console.log('clear')
    return { success: true, message: 'clear AttendanceLog successfully' };
  } catch (error) {
    console.error('Failed to clear Attendance Log:', error.message);
    return { success: false, message: error.message };
  }
});

// Device Management Handlers
ipcMain.handle('add-device', async (event, device) => {
  try {
    return await addDevice(device);
  } catch (err) {
    console.error(err.message);
    throw err;
  }
});

ipcMain.handle('edit-device', async (event, { id, updatedDevice }) => {
  try {
    return await editDevice(id, updatedDevice);
  } catch (err) {
    console.error(err.message);
    throw err;
  }
});

ipcMain.handle('delete-device', async (event, id) => {
  try {
    return await deleteDevice(id);
  } catch (err) {
    console.error(err.message);
    throw err;
  }
});

// Fix for Electron keyboard focus issue - force window to refocus using hidden booster
ipcMain.handle('window-refocus', async () => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return { success: false, message: 'Window not available' };
    }

    if (!focusBooster || focusBooster.isDestroyed()) {
      return { success: false, message: 'Focus booster not available' };
    }

    // Step 1 - Force OS to switch focus invisibly
    focusBooster.showInactive(); // No visual flash
    focusBooster.focus();        // OS keyboard resets focus

    // Step 2 - Immediately return focus to main window
    setTimeout(() => {
      if (!focusBooster.isDestroyed() && !mainWindow.isDestroyed()) {
        focusBooster.hide();           // Stays hidden, no flash
        mainWindow.focus();
        mainWindow.webContents.focus();
      }
    }, 20); // Needs ~20ms on Windows for OS to register the focus change

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// App lifecycle events
app.on('ready', () => {
  createWindow();
  createTrayIcon();
  createFocusBooster();
  initializeBackgroundMonitoring();
});

app.on('window-all-closed', () => {
  app.dock.hide()
  // any other logic
});
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', async (event) => {
  event.preventDefault(); // Prevent immediate quit
  // await stopRealtimeMonitoring(); // Ensure clean disconnection
  app.exit(0);
});