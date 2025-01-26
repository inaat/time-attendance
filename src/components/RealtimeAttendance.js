import React, { useState, useEffect } from 'react';
import { Card, CardTitle, CardText, Col, Row, Spinner, Button } from 'reactstrap';
import DataTable from 'react-data-table-component';
const { ipcRenderer } = window.require('electron');

const RealtimeAttendance = (props) => {
  const [attendanceLogs, setAttendanceLogs] = useState([]); // Real-time attendance logs
  const [loading, setLoading] = useState(false); // Loading state
  const [devices, setDevices] = useState([]); // List of devices

  // Fetch devices when the component mounts
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const deviceData = await ipcRenderer.invoke('fetch-all-devices');
        setDevices(deviceData);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
      }
    };

    fetchDevices();
  }, []);

  // Table columns configuration
  const columns = [
    { name: 'Device IP', selector: row => row.deviceIp, sortable: true },
    { name: 'User ID', selector: row => row.userId, sortable: true },
    { name: 'Date', selector: row => row.date, sortable: true },
    { name: 'Time', selector: row => row.time, sortable: true },
  ];

  // Start real-time monitoring when devices are fetched
  useEffect(() => {
    if (devices.length > 0) {
      setLoading(true);

  
      const handleRealtimeAttendance = (event, log) => {
        setAttendanceLogs((prevLogs) => [log, ...prevLogs]);
      };
      setLoading(false);
      ipcRenderer.on('realtime-attendance', handleRealtimeAttendance);

      // Cleanup listener and stop monitoring when the component unmounts
      return () => {
        ipcRenderer.removeListener('realtime-attendance', handleRealtimeAttendance);
       
      };
    }
  }, [devices]);

  return (
    <React.Fragment>
      <Row>
        <Col sm="12">
          <Button onClick={props.goBackButton} className="primary">BACK</Button>
          <Card body>
            <CardTitle tag="h5">Real-Time Attendance</CardTitle>
            <CardText>View real-time attendance logs from multiple devices</CardText>
          </Card>
        </Col>
      </Row>

      

      <Row>
        <Col sm="12">
          {loading ? (
            <Spinner color="primary" />
          ) : (
            <DataTable
              title="Real-Time Attendance Logs"
              columns={columns}
              data={attendanceLogs}
              responsive
              highlightOnHover
              pagination
            />
          )}
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default RealtimeAttendance;