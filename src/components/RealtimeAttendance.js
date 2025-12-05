import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardTitle, CardText, Col, Row, Spinner, Button } from 'reactstrap';
import DataTable from 'react-data-table-component';
const { ipcRenderer } = window.require('electron');

const RealtimeAttendance = (props) => {
  const { t } = useTranslation();
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
    { name: t('realtime.columns.deviceIp'), selector: row => row.deviceIp, sortable: true },
    { name: t('realtime.columns.userId'), selector: row => row.userId, sortable: true },
    { name: t('realtime.columns.date'), selector: row => row.date, sortable: true },
    { name: t('realtime.columns.time'), selector: row => row.time, sortable: true },
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
          <Button onClick={props.goBackButton} color="primary" size="sm">{t('common.back')}</Button>
          <Card body>
            <CardTitle tag="h5">{t('realtime.title')}</CardTitle>
            <CardText>{t('realtime.subtitle')}</CardText>
          </Card>
        </Col>
      </Row>



      <Row>
        <Col sm="12">
          {loading ? (
            <Spinner color="primary" />
          ) : (
            <DataTable
              title={t('realtime.logsTitle')}
              columns={columns}
              data={attendanceLogs}
              responsive
              highlightOnHover
              pagination
              noDataComponent={t('common.noData')}
              paginationComponentOptions={{
                rowsPerPageText: t('common.rowsPerPage'),
                rangeSeparatorText: t('common.of'),
              }}
            />
          )}
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default RealtimeAttendance;