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
  const [isFetching, setIsFetching] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    isSyncing: false
  });
  const [cancelRequested, setCancelRequested] = useState(false);

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

    try {
      let successCount = 0;
      let failedCount = 0;

      // Sync all attendance records
      for (const [index, record] of attendanceList.entries()) {
        if (cancelRequested) break;

        try {
          const payload = selectedDevice.type === 'staff' 
            ? { employee_id: record.userId, date: `${record.date} ${record.time}` }
            : { student_id: record.userId, date: `${record.date} ${record.time}` };

          await axios.post(selectedDevice.url, payload);
          successCount++;
        } catch (apiError) {
          failedCount++;
          console.error(`Sync failed for ${record.userId}:`, apiError.message);
        }

        setSyncProgress(prev => ({
          ...prev,
          current: index + 1,
          success: successCount,
          failed: failedCount
        }));
      }

      // Clear attendance logs after successful sync
      if (!cancelRequested && syncProgress.current === syncProgress.total) {
        const confirmClear = window.confirm(
          `Sync completed. Clear attendance logs from ${selectedDevice.ip}?`
        );

        if (confirmClear) {
          try {
            const clearResult = await ipcRenderer.invoke('clear-attendance-log', { 
              device: selectedDevice
            });

            if (clearResult.success) {
              alert('Attendance logs cleared successfully from device');
              setAttendanceList([]); // Clear local attendance list
              await fetchAttendanceFromDevice(); // Refresh attendance list
            } else {
              alert(`Failed to clear logs: ${clearResult.message}`);
            }
          } catch (error) {
            alert(`Error clearing logs: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      setSyncProgress(prev => ({ ...prev, isSyncing: false }));
      
      if (cancelRequested) {
        alert('Sync cancelled by user');
      } else {
        alert(`Sync completed: ${syncProgress.success} succeeded, ${syncProgress.failed} failed`);
      }
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
          <DataTable
            title="📋 Attendance Records"
            columns={columns}
            data={attendanceList}
            responsive
            pagination
            highlightOnHover
            noDataComponent="No attendance records found"
          />
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default Attendance;