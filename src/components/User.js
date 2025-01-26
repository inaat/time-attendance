import React, { useState, useEffect } from 'react';
import {
  Card, CardTitle, CardText, Col, Row, Button, Input, FormGroup, Label, Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from 'reactstrap';
import DataTable from 'react-data-table-component';
const { ipcRenderer } = window.require('electron');

const User = (props) => {
  const [devices, setDevices] = useState([]); // List of devices
  const [selectedDevice, setSelectedDevice] = useState(null); // Selected device
  const [userList, setUserList] = useState([]); // List of users for the selected device
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

  // Table columns configuration
  const columns = [
    { name: 'Card Number', selector: row => row.cardno, sortable: true },
    { name: 'Name', selector: row => row.name, sortable: true },
    { name: 'User ID', selector: row => row.userId, sortable: true },
    { name: 'Role', selector: row => row.role, sortable: true, cell: row => (row.role === 0 ? 'User' : 'Admin') },
    { name: 'UID', selector: row => row.uid, sortable: true },
    {
      
        name: 'Actions',
        cell: row => (
          <div>
            <Button size="sm" color="warning" onClick={() => handleEdit(row)}>Edit</Button>{' '}
            <Button size="sm" color="danger" onClick={() => handleDelete(row)}>Delete</Button>
          </div>
        ),
        ignoreRowClick: true, // Keep this if needed
      }
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

  // Fetch users for the selected device
  const fetchUsersFromDevice = async () => {
    if (!selectedDevice) return;

    setLoading(true); // Start loading
    try {
      const response = await ipcRenderer.invoke('fetch-users-from-device', selectedDevice);
      if (response && Array.isArray(response.data)) {
        setUserList(response.data); // Set the user data array
      } else {
        console.error('Unexpected data structure:', response);
        setUserList([]); // Clear the table if the data structure is invalid
      }
    } catch (error) {
      console.error('Failed to fetch users:', error.message);
      alert(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Handle device selection change
  const handleDeviceChange = (e) => {
    const selectedDeviceId = e.target.value;
    const device = devices.find(d => d.id.toString() === selectedDeviceId);
    setSelectedDevice(device || null);
    setUserList([]); // Clear user list when changing devices
  };

  // Handle editing a user
  const handleEdit = (user) => {
    setEditUser({ ...user }); // Clone user object for editing
    setIsEditModalOpen(true); // Open the edit modal
  };

  // Save edited user
  const handleEditSave = async () => {
    try {
      await ipcRenderer.invoke('update-user-on-device', { device: selectedDevice, user: editUser });
      fetchUsersFromDevice(); // Refresh the user list
      alert('User updated successfully!');
    } catch (error) {
      console.error('Failed to update user:', error.message);
      alert(`Failed to update user: ${error.message}`);
    } finally {
      setIsEditModalOpen(false); // Close the modal
    }
  };

  // Handle deleting a user
  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      try {
        await ipcRenderer.invoke('delete-user-from-device', { device: selectedDevice, uid: user.uid });
        fetchUsersFromDevice(); // Refresh the user list
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Failed to delete user:', error.message);
        alert(`Failed to delete user: ${error.message}`);
      }
    }
  };

  // Handle adding a new user
  const handleAddUser = async () => {
    if (!selectedDevice) return;

    try {
      await ipcRenderer.invoke('add-user-to-device', { device: selectedDevice, user: newUser });
      fetchUsersFromDevice(); // Refresh the user list
      alert('User added successfully!');
      setIsAddModalOpen(false); // Close the modal
      setNewUser({ name: '', userId: '', cardno: '', role: 0, uid: '' }); // Reset the form
    } catch (error) {
      console.error('Failed to add user:', error.message);
      alert(`Failed to add user: ${error.message}`);
    }
  };

  return (
    <React.Fragment>
      <Row>
        <Col sm="12">
          <Button onClick={props.goBackButton} className="primary">BACK</Button>
          <Card body>
            <CardTitle tag="h5">View Enrolled Students</CardTitle>
            <CardText>View the students who are enrolled in the system</CardText>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col sm="12">
          <FormGroup>
            <Label for="deviceSelect">Select Device</Label>
            <Input
              type="select"
              name="deviceSelect"
              id="deviceSelect"
              value={selectedDevice ? selectedDevice.id : ''}
              onChange={handleDeviceChange}
            >
              <option value="">Select a device</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name || device.ip}
                </option>
              ))}
            </Input>
          </FormGroup>

          <Button color="primary" onClick={fetchUsersFromDevice} disabled={!selectedDevice || loading}>
            {loading ? <Spinner size="sm" /> : 'Fetch Users'}
          </Button>
          <Button color="success" onClick={() => setIsAddModalOpen(true)} disabled={!selectedDevice}>
            Add User
          </Button>
        </Col>
      </Row>

      <Row>
        <Col sm="12">
          <DataTable
            title="User List"
            columns={columns}
            data={userList}
            responsive
            highlightOnHover
          />
        </Col>
      </Row>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} toggle={() => setIsEditModalOpen(!isEditModalOpen)}>
        <ModalHeader toggle={() => setIsEditModalOpen(!isEditModalOpen)}>Edit User</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="editName">Name</Label>
            <Input
              id="editName"
              value={editUser?.name || ''}
              onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="editUserID">User ID</Label>
            <Input
              id="editUserID"
              value={editUser?.userId || ''}
              onChange={(e) => setEditUser({ ...editUser, userId: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="editRole">Role</Label>
            <Input
              id="editRole"
              type="select"
              value={editUser?.role || ''}
              onChange={(e) => setEditUser({ ...editUser, role: parseInt(e.target.value) })}
            >
              <option value={0}>User</option>
              <option value={1}>Admin</option>
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleEditSave}>Save</Button>
          <Button color="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} toggle={() => setIsAddModalOpen(!isAddModalOpen)}>
        <ModalHeader toggle={() => setIsAddModalOpen(!isAddModalOpen)}>Add User</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="addUID">UID</Label>
            <Input
              id="addUID"
              value={newUser?.uid || ''}
              onChange={(e) => setNewUser({ ...newUser, uid: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="addName">Name</Label>
            <Input
              id="addName"
              value={newUser?.name || ''}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="addUserID">User ID</Label>
            <Input
              id="addUserID"
              value={newUser?.userId || ''}
              onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
            />
          </FormGroup>
         
          <FormGroup>
            <Label for="addRole">Role</Label>
            <Input
              id="addRole"
              type="select"
              value={newUser?.role || ''}
              onChange={(e) => setNewUser({ ...newUser, role: parseInt(e.target.value) })}
            >
              <option value={0}>User</option>
              <option value={1}>Admin</option>
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleAddUser}>Add</Button>
          <Button color="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default User;