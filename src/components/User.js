import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, CardTitle, CardText, Col, Row, Button, Input, FormGroup, Label, Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from 'reactstrap';
import DataTable from 'react-data-table-component';
const { ipcRenderer } = window.require('electron');
const axios = require('axios');

const User = (props) => {
  const { t } = useTranslation();
  const [devices, setDevices] = useState([]); // List of devices
  const [selectedDevice, setSelectedDevice] = useState(null); // Selected device
  const [userList, setUserList] = useState([]); // List of users for the selected device
  const [filteredUsers, setFilteredUsers] = useState([]); // Filtered user list for search
  const [searchText, setSearchText] = useState(''); // Search text
  const [selectedRows, setSelectedRows] = useState([]); // Selected rows for bulk sync
  const [loading, setLoading] = useState(false); // Loading state for fetching users
  const [editUser, setEditUser] = useState(null); // User being edited
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Edit modal visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Add modal visibility
  const [newUser, setNewUser] = useState({ // New user data
    name: '',
    userId: '',
    cardno: '',
    role: 0,
    uid: ''
  });
  const [progress, setProgress] = useState(0); // Progress state

  // Fix focus for search input
  const handleSearchClick = async () => {
    try {
      await ipcRenderer.invoke('window-refocus');
    } catch (error) {
      console.error('Focus fix failed:', error);
    }
  };

  const columns = [
    { name: t('users.columns.cardNumber'), selector: row => row.cardno, sortable: true },
    { name: t('users.columns.name'), selector: row => row.name, sortable: true },
    { name: t('users.columns.userId'), selector: row => row.userId, sortable: true },
    {
      name: t('users.columns.role'),
      selector: row => row.role,
      sortable: true,
      cell: row => (row.role === 0 ? t('users.roles.user') : t('users.roles.admin')),
    },
    { name: t('users.columns.uid'), selector: row => row.uid, sortable: true },
    { name: t('users.columns.employeeStatus'), selector: row => row.employee_status, sortable: true },
    {
      name: t('users.columns.status'),
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span style={{ color: row.status === 'not_sync' ? 'red' : 'green' }}>
          {row.status === 'not_sync' ? t('users.status.notSynced') : t('users.status.synced')}
        </span>
      ),
    },
    {
      name: t('users.columns.actions'),
      cell: row => (
        <div>
          {row.status === 'sync' ? (
            <>
              <Button size="sm" color="warning" onClick={() => handleEdit(row)}>
                {t('users.actions.edit')}
              </Button>{' '}
              <Button size="sm" color="danger" onClick={() => handleDelete(row)}>
                {t('users.actions.delete')}
              </Button>
            </>
          ) : (
            <Button size="sm" color="primary" onClick={() => handleSync(row)}>
              {t('users.actions.sync')}
            </Button>
          )}
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

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

  // Filter users based on search text
  useEffect(() => {
    if (searchText === '') {
      setFilteredUsers(userList);
    } else {
      const filtered = userList.filter(user =>
        user.userId?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.cardno?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
        user.uid?.toString().toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchText, userList]);

  // Fix focus when modals open
  useEffect(() => {
    const fixFocus = async () => {
      if (isAddModalOpen || isEditModalOpen) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait for modal to render
          await ipcRenderer.invoke('window-refocus');
        } catch (error) {
          console.error('Focus fix failed:', error);
        }
      }
    };
    fixFocus();
  }, [isAddModalOpen, isEditModalOpen]);

  // Fetch users for the selected device
  const fetchUsersFromDevice = async () => {
    if (!selectedDevice) return;

    setLoading(true); // Start loading
    try {
      const response = await ipcRenderer.invoke('fetch-users-from-device', selectedDevice);

      if (response && Array.isArray(response.data)) {
        const apiResponse = await axios.get(selectedDevice.get_user_url, {
          params: {
            type: selectedDevice.type,
            token: selectedDevice.token,
          },
        });
        const apiData = apiResponse.data;

        // Map API users and match with device users
        const updatedUserList = apiData.map(apiUser => {
          const matchedDeviceUser = response.data.find(deviceUser => deviceUser.userId === apiUser.userId);

          if (matchedDeviceUser) {
            // User exists in both API and device - mark as synced
            return {
              cardno: matchedDeviceUser.cardno,
              userId: matchedDeviceUser.userId,
              name: matchedDeviceUser.name,
              password: matchedDeviceUser.password,
              role: matchedDeviceUser.role,
              uid: matchedDeviceUser.uid,
              status: 'sync',
              employee_status: apiUser.status
            };
          } else {
            // User exists only in API - mark as not synced
            return {
              cardno: 0,
              userId: apiUser.userId,
              name: apiUser.name,
              password: '',
              role: 0,
              uid: 0,
              status: 'not_sync',
              employee_status: apiUser.status
            };
          }
        });

        // Find users that exist in device but NOT in API
        const deviceOnlyUsers = response.data.filter(deviceUser => {
          return !apiData.find(apiUser => apiUser.userId === deviceUser.userId);
        }).map(deviceUser => ({
          cardno: deviceUser.cardno,
          userId: deviceUser.userId,
          name: deviceUser.name,
          password: deviceUser.password,
          role: deviceUser.role,
          uid: deviceUser.uid,
          status: 'sync',
          employee_status: 'device_only' // Mark as device only
        }));

        // Combine both lists
        setUserList([...updatedUserList, ...deviceOnlyUsers]);
      } else {
        setUserList([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error.message);
      alert(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleDeviceChange = (e) => {
    const selectedDeviceId = e.target.value;
    const device = devices.find(d => d.id.toString() === selectedDeviceId);
    setSelectedDevice(device || null);
    setUserList([]);
  };

  const handleSync = async (user) => {
    if (!selectedDevice) {
      alert('No device selected!');
      return;
    }

    setLoading(true);
    try {
      await ipcRenderer.invoke('add-user-to-device', { device: selectedDevice, user });
      await fetchUsersFromDevice();
      alert('User synced successfully!');
    } catch (error) {
      console.error('Failed to sync user:', error.message);
      alert(`Failed to sync user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    try {
      await ipcRenderer.invoke('update-user-on-device', { device: selectedDevice, user: editUser });
      fetchUsersFromDevice();
      alert('User updated successfully!');
    } catch (error) {
      console.error('Failed to update user:', error.message);
      alert(`Failed to update user: ${error.message}`);
    } finally {
      setIsEditModalOpen(false);
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      try {
        await ipcRenderer.invoke('delete-user-from-device', { device: selectedDevice, uid: user.uid });
        fetchUsersFromDevice();
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Failed to delete user:', error.message);
        alert(`Failed to delete user: ${error.message}`);
      }
    }
  };

  const handleAddUser = async () => {
    if (!selectedDevice) return;

    try {
      await ipcRenderer.invoke('add-user-to-device', { device: selectedDevice, user: newUser });
      fetchUsersFromDevice();
      alert('User added successfully!');
      setIsAddModalOpen(false);
      setNewUser({ name: '', userId: '', cardno: '', role: 0, uid: '' });
    } catch (error) {
      console.error('Failed to add user:', error.message);
      alert(`Failed to add user: ${error.message}`);
    }
  };

  const SyncUsersToDevice = async () => {
    if (!selectedDevice) return;

    setLoading(true);
    setProgress(0);

    try {
      const usersToSync = userList.filter(user => user.status === 'not_sync');

      if (usersToSync.length === 0) {
        alert('No users to sync!');
        return;
      }

      const totalUsers = usersToSync.length;
      let processedUsers = 0;

      for (const user of usersToSync) {
        await ipcRenderer.invoke('add-user-to-device', { device: selectedDevice, user });
        processedUsers++;
        setProgress((processedUsers / totalUsers) * 100);
      }

      await fetchUsersFromDevice();
      alert('Users synced successfully!');
    } catch (error) {
      console.error('Failed to sync users:', error.message);
      alert(`Failed to sync users: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const DeleteNonUsersToDevice = async () => {
    if (!selectedDevice) return;

    setLoading(true);
    setProgress(0);

    try {
      const usersToDelete = userList.filter(user => user.employee_status !== 'active'|| user.employee_status !== 'A' || user.employee_status !== 'L');

      if (usersToDelete.length === 0) {
        alert('No non-active users to delete!');
        return;
      }

      const totalUsers = usersToDelete.length;
      let processedUsers = 0;

      for (const user of usersToDelete) {
        await ipcRenderer.invoke('delete-user-from-device', { device: selectedDevice, uid: user.uid });
        processedUsers++;
        setProgress((processedUsers / totalUsers) * 100);
      }

      await fetchUsersFromDevice();
      alert('Non-active users deleted successfully!');
    } catch (error) {
      console.error('Failed to delete non-active users:', error.message);
      alert(`Failed to delete non-active users: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const SyncSelectedUsers = async () => {
    if (!selectedDevice || selectedRows.length === 0) {
      alert('Please select users to sync!');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const totalUsers = selectedRows.length;
      let processedUsers = 0;

      for (const user of selectedRows) {
        await ipcRenderer.invoke('add-user-to-device', { device: selectedDevice, user });
        processedUsers++;
        setProgress((processedUsers / totalUsers) * 100);
      }

      await fetchUsersFromDevice();
      setSelectedRows([]);
      alert(`${totalUsers} user(s) synced successfully!`);
    } catch (error) {
      console.error('Failed to sync selected users:', error.message);
      alert(`Failed to sync users: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <React.Fragment>
      {/* Device Selection */}
      <Row>
        <Col sm="12">
          <Button onClick={props.goBackButton} color="primary" size="sm">
            {t('common.back')}
          </Button>
          <Card body className="mt-3">
            <CardTitle tag="h5">{t('users.deviceSelection')}</CardTitle>
            <CardText>
              {t('users.selectDevice')}
            </CardText>
            <Input
              type="select"
              name="deviceSelect"
              id="deviceSelect"
              value={selectedDevice ? selectedDevice.id : ''}
              onChange={handleDeviceChange}
            >
              <option value="">{t('users.selectDevicePlaceholder')}</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name || device.ip}
                </option>
              ))}
            </Input>
            {/* <Input
              type="select"
              onChange={handleDeviceChange}
              value={selectedDevice ? selectedDevice.id : ''}
            >
              <option value="">Select a device</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </Input> */}
          </Card>
        </Col>
      </Row>

      {/* Buttons for Actions */}
      <Row style={{ marginTop: '20px' }}>
        <Col sm="6">
          <Button color="primary" block onClick={fetchUsersFromDevice} disabled={!selectedDevice || loading}>
            {t('users.fetchUsers')}
          </Button>
        </Col>
        <Col sm="6">
          <Button color="success" block onClick={SyncUsersToDevice} disabled={!selectedDevice || loading}>
            {t('users.syncUsers')}
          </Button>
        </Col>
      </Row>
      <Row style={{ marginTop: '20px' }}>
        <Col sm="4">
          <Button color="danger" block onClick={DeleteNonUsersToDevice} disabled={!selectedDevice || loading}>
            {t('users.deleteNonActive')}
          </Button>
        </Col>
        <Col sm="4">
          <Button color="info" block onClick={() => setIsAddModalOpen(true)} disabled={!selectedDevice || loading}>
            {t('users.addUser')}
          </Button>
        </Col>
        <Col sm="4">
          <Button color="warning" block onClick={SyncSelectedUsers} disabled={!selectedDevice || loading || selectedRows.length === 0}>
            {t('users.syncSelected')} ({selectedRows.length})
          </Button>
        </Col>
      </Row>

      {/* Loading Spinner */}
      {loading && (
        <Row style={{ marginTop: '20px' }}>
          <Col sm="12" className="text-center">
            <Spinner style={{ width: '3rem', height: '3rem' }} color="primary" />
          </Col>
        </Row>
      )}

      {/* Progress Bar */}
      <Row style={{ marginTop: '20px' }}>
        <Col sm="12">
          {progress > 0 && (
            <div>
              <div className="progress">
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* User Table */}
      <Row style={{ marginTop: '20px' }}>
        <Col sm="12">
          <Card body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">{t('users.title')} ({filteredUsers.length})</h5>
              <Input
                type="text"
                placeholder={t('users.searchPlaceholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClick={handleSearchClick}
                style={{ maxWidth: '400px' }}
              />
            </div>
            <DataTable
              columns={columns}
              data={filteredUsers}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 50, 100, filteredUsers.length]}
              selectableRows
              selectableRowsHighlight
              onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
              clearSelectedRows={selectedRows.length === 0}
              highlightOnHover
              striped
              responsive
              noDataComponent={t('common.noData')}
              paginationComponentOptions={{
                rowsPerPageText: t('common.rowsPerPage'),
                rangeSeparatorText: t('common.of'),
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} toggle={() => setIsAddModalOpen(!isAddModalOpen)}>
        <ModalHeader toggle={() => setIsAddModalOpen(!isAddModalOpen)}>{t('users.modal.addTitle')}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="name">{t('users.modal.name')}</Label>
            <Input
              id="name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="userId">{t('users.modal.userId')}</Label>
            <Input
              id="userId"
              value={newUser.userId}
              onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="cardno">{t('users.modal.cardNumber')}</Label>
            <Input
              id="cardno"
              value={newUser.cardno}
              onChange={(e) => setNewUser({ ...newUser, cardno: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="role">{t('users.modal.role')}</Label>
            <Input
              id="role"
              type="select"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: parseInt(e.target.value) })}
            >
              <option value="0">{t('users.roles.user')}</option>
              <option value="1">{t('users.roles.admin')}</option>
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleAddUser}>{t('users.modal.add')}</Button>{' '}
          <Button color="secondary" onClick={() => setIsAddModalOpen(false)}>{t('users.modal.cancel')}</Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} toggle={() => setIsEditModalOpen(!isEditModalOpen)}>
        <ModalHeader toggle={() => setIsEditModalOpen(!isEditModalOpen)}>{t('users.modal.editTitle')}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="editName">{t('users.modal.name')}</Label>
            <Input
              id="editName"
              value={editUser?.name || ''}
              onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="editUserId">{t('users.modal.userId')}</Label>
            <Input
              id="editUserId"
              value={editUser?.userId || ''}
              onChange={(e) => setEditUser({ ...editUser, userId: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="editCardno">{t('users.modal.cardNumber')}</Label>
            <Input
              id="editCardno"
              value={editUser?.cardno || ''}
              onChange={(e) => setEditUser({ ...editUser, cardno: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="editRole">{t('users.modal.role')}</Label>
            <Input
              id="editRole"
              type="select"
              value={editUser?.role || 0}
              onChange={(e) => setEditUser({ ...editUser, role: parseInt(e.target.value) })}
            >
              <option value="0">{t('users.roles.user')}</option>
              <option value="1">{t('users.roles.admin')}</option>
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleEditSave}>{t('users.modal.save')}</Button>{' '}
          <Button color="secondary" onClick={() => setIsEditModalOpen(false)}>{t('users.modal.cancel')}</Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default User;
