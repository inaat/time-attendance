import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card, CardTitle, CardText, Col, Row, Button, Input, FormGroup, Label, Spinner, Progress
} from 'reactstrap';
import DataTable from 'react-data-table-component';
const { ipcRenderer } = window.require('electron');

const Attendance = (props) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    isSyncing: false
  });
  const [cancelRequested, setCancelRequested] = useState(false);

  // Fix focus for search input
  const handleSearchClick = async () => {
    try {
      await ipcRenderer.invoke('window-refocus');
    } catch (error) {
      console.error('Focus fix failed:', error);
    }
  };

  const columns = [
    { name: 'IP', selector: row => row.ip, sortable: true },
    { name: 'User ID', selector: row => row.userId, sortable: true },
    { name: 'Name', selector: row => row.name, sortable: true },
    { name: 'Date', selector: row => row.date, sortable: true },
    { name: 'Time', selector: row => row.time, sortable: true },
    { name: 'Count', selector: row => row.Count, sortable: true },
  ];

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const deviceData = await ipcRenderer.invoke('fetch-all-devices');
        setDevices(deviceData);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
        alert('Failed to load devices. Please try again.');
      }
    };
    fetchDevices();
  }, []);

  // Filter attendance list based on search text
  useEffect(() => {
    if (searchText === '') {
      setFilteredAttendance(attendanceList);
    } else {
      const filtered = attendanceList.filter(item =>
        item.userId?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.ip?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.date?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.time?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredAttendance(filtered);
    }
  }, [searchText, attendanceList]);

  const fetchAttendanceFromDevice = async () => {
    if (!selectedDevice) return;

    setIsFetching(true);
    try {
      const response = await ipcRenderer.invoke('fetch-attendance-from-device', selectedDevice);

      if (response.success && Array.isArray(response.data)) {
        const formattedAttendance = response.data.map(log => ({
          ip: log.ip,
          userId: log.UserId,
          name: log.Name,
          date: new Date(log.recordTime).toISOString().split('T')[0],
          time: new Date(log.recordTime).toTimeString().split(' ')[0],
          Count: log.Count,
        }));

        setAttendanceList(formattedAttendance);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error.message);
      alert(`Failed to fetch attendance: ${error.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  const startSync = async () => {
    if (!selectedDevice || attendanceList.length === 0) return;

    setCancelRequested(false);
    setSyncProgress({
      total: attendanceList.length,
      current: 0,
      success: 0,
      failed: 0,
      isSyncing: true
    });

    const BATCH_SIZE = 1000; // Process 1000 records per batch
    let totalSuccess = 0;
    let totalFailed = 0;

    try {
      // Split records into batches
      const batches = [];
      for (let i = 0; i < attendanceList.length; i += BATCH_SIZE) {
        batches.push(attendanceList.slice(i, i + BATCH_SIZE));
      }

      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (cancelRequested) break;

        const batch = batches[batchIndex];

        // Prepare batch data
        const batchData = batch.map(record => {
          if (selectedDevice.type === 'staff') {
            return {
              employee_id: record.userId,
              date: `${record.date} ${record.time}`
            };
          } else {
            return {
              student_id: record.userId,
              date: `${record.date} ${record.time}`
            };
          }
        });

        try {
          // Send batch request with token
          const payload = {
            data: batchData,
            token: selectedDevice.token
          };

          await axios.post(selectedDevice.url, payload);

          // If request successful, count entire batch as success
          totalSuccess += batch.length;

          console.log(`Batch ${batchIndex + 1}/${batches.length}: ${batch.length} records sent successfully`);

        } catch (error) {
          console.error(`Batch ${batchIndex + 1} failed:`, error);
          totalFailed += batch.length; // Count entire batch as failed
        }

        // Update progress
        setSyncProgress({
          total: attendanceList.length,
          current: (batchIndex + 1) * BATCH_SIZE > attendanceList.length
            ? attendanceList.length
            : (batchIndex + 1) * BATCH_SIZE,
          success: totalSuccess,
          failed: totalFailed,
          isSyncing: true
        });
      }

      setSyncProgress(prev => ({ ...prev, isSyncing: false }));

      // Clear attendance logs after successful sync
      if (!cancelRequested) {
        const confirmClear = window.confirm(
          `Sync completed: ${totalSuccess} succeeded, ${totalFailed} failed.\nClear attendance logs from ${selectedDevice.ip}?`
        );

        if (confirmClear) {
          try {
            setAttendanceList([]);
            await fetchAttendanceFromDevice();
          } catch (error) {
            alert(`Error clearing logs: ${error.message}`);
          }
        }
      }

      alert(`Sync completed: ${totalSuccess} succeeded, ${totalFailed} failed`);

    } catch (error) {
      console.error('Sync process failed:', error);
      alert(`Sync failed: ${error.message}`);
      setSyncProgress(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleDeviceChange = (e) => {
    if (syncProgress.isSyncing) {
      if (!window.confirm('Sync in progress. Are you sure you want to change device?')) return;
      setCancelRequested(true);
    }

    const selectedDeviceId = e.target.value;
    const device = devices.find(d => d.id.toString() === selectedDeviceId);
    setSelectedDevice(device || null);
    setAttendanceList([]);
  };

  const progressPercentage = () => {
    if (syncProgress.total === 0) return 0;
    return Math.round((syncProgress.current / syncProgress.total) * 100);
  };

  return (
    <React.Fragment>
      <Row>
        <Col sm="12">
          <Button onClick={props.goBackButton} color="primary">BACK</Button>
          <Card body className="mt-3">
            <CardTitle tag="h5">Attendance Management System</CardTitle>
            <CardText>
              {selectedDevice && (
                `Connected to: ${selectedDevice.name || selectedDevice.ip} (${selectedDevice.type.toUpperCase()})`
              )}
            </CardText>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col sm="12">
          <FormGroup>
            <Label for="deviceSelect">Select Biometric Device</Label>
            <Input
              type="select"
              name="deviceSelect"
              id="deviceSelect"
              value={selectedDevice?.id || ''}
              onChange={handleDeviceChange}
              disabled={syncProgress.isSyncing}
            >
              <option value="">Select a device</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name || device.ip} ({device.type})
                </option>
              ))}
            </Input>
          </FormGroup>

          <div className="d-flex align-items-center gap-2 mb-3">
            <Button
              color="info"
              onClick={fetchAttendanceFromDevice}
              disabled={!selectedDevice || isFetching}
            >
              {isFetching ? <Spinner size="sm" /> : '📥 Fetch Records'}
            </Button>

            <Button
              color="primary"
              onClick={startSync}
              disabled={!attendanceList.length || syncProgress.isSyncing}
            >
              {syncProgress.isSyncing ? <Spinner size="sm" /> : '🔄 Sync Records'}
            </Button>

            {syncProgress.isSyncing && (
              <Button
                color="danger"
                onClick={() => setCancelRequested(true)}
              >
                ⚠️ Cancel Sync
              </Button>
            )}
          </div>

          {syncProgress.isSyncing && (
            <div className="mt-3">
              <Progress
                value={progressPercentage()}
                color={cancelRequested ? 'warning' : 'primary'}
                striped
                animated
              >
                {progressPercentage()}%
              </Progress>
              <div className="progress-details mt-2">
                <span className="badge bg-info">
                  Processed: {syncProgress.current}/{syncProgress.total}
                </span>
                <span className="badge bg-success ms-2">
                  Success: {syncProgress.success}
                </span>
                <span className="badge bg-danger ms-2">
                  Failed: {syncProgress.failed}
                </span>
              </div>
            </div>
          )}
        </Col>
      </Row>

      <Row>
        <Col sm="12">
          <Card body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">📋 Attendance Records ({filteredAttendance.length})</h5>
              <Input
                type="text"
                placeholder="Search by User ID, Name, IP, Date, Time..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClick={handleSearchClick}
                style={{ maxWidth: '400px' }}
              />
            </div>
            <DataTable
              columns={columns}
              data={filteredAttendance}
              responsive
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 50, 100, 500, filteredAttendance.length]}
              highlightOnHover
              striped
              noDataComponent="No attendance records found"
              paginationComponentOptions={{
                rowsPerPageText: 'Rows per page:',
                rangeSeparatorText: 'of',
              }}
            />
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default Attendance;