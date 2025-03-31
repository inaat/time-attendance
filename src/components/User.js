// import React, { useState, useEffect } from 'react';
// import {
//   Card, CardTitle, CardText, Col, Row, Button, Input, FormGroup, Label, Modal, ModalHeader, ModalBody, ModalFooter, Spinner
// } from 'reactstrap';
// import DataTable from 'react-data-table-component';
// const { ipcRenderer } = window.require('electron');
// const axios = require('axios');

// const User = (props) => {
//   const [devices, setDevices] = useState([]); // List of devices
//   const [selectedDevice, setSelectedDevice] = useState(null); // Selected device
//   const [userList, setUserList] = useState([]); // List of users for the selected device
//   const [loading, setLoading] = useState(false); // Loading state for fetching users
//   const [editUser, setEditUser] = useState(null); // User being edited
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Edit modal visibility
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Add modal visibility
//   const [newUser, setNewUser] = useState({ // New user data
//     name: '',
//     userId: '',
//     cardno: '',
//     role: 0,
//     uid: ''
//   });


//   const columns = [
//     { name: 'Card Number', selector: row => row.cardno, sortable: true },
//     { name: 'Name', selector: row => row.name, sortable: true },
//     { name: 'User ID', selector: row => row.userId, sortable: true },
//     {
//       name: 'Role',
//       selector: row => row.role,
//       sortable: true,
//       cell: row => (row.role === 0 ? 'User' : 'Admin'),
//     },
//     { name: 'UID', selector: row => row.uid, sortable: true },
//     { name: 'Employee Status', selector: row => row.employee_status, sortable: true },
//     {
//       name: 'Status',
//       selector: row => row.status,
//       sortable: true,
//       cell: row => (
//         <span style={{ color: row.status === 'not_sync' ? 'red' : 'green' }}>
//           {row.status === 'not_sync' ? 'Not Synced' : 'Synced'}
//         </span>
//       ),
//     },
//     {
//       name: 'Actions',
//       cell: row => (
//         <div>
//           {row.status === 'sync' ? (
//             <>
//               <Button size="sm" color="warning" onClick={() => handleEdit(row)}>
//                 Edit
//               </Button>{' '}
//               <Button size="sm" color="danger" onClick={() => handleDelete(row)}>
//                 Delete
//               </Button>
//             </>
//           ) : (
//             <Button size="sm" color="primary" onClick={() => handleSync(row)}>
//               Sync
//             </Button>
//           )}
//         </div>
//       ),
//       ignoreRowClick: true,
//     },
//   ];
  
//   // Fetch devices when the component mounts
//   useEffect(() => {
//     const fetchDevices = async () => {
//       try {
//         const deviceData = await ipcRenderer.invoke('fetch-all-devices');
//         setDevices(deviceData);
//       } catch (error) {
//         console.error('Failed to fetch devices:', error);
//       }
//     };

//     fetchDevices();
//   }, []);

//   // Fetch users for the selected device

//   // Fetch users for the selected device
//   const fetchUsersFromDevice = async () => {
//     if (!selectedDevice) return;
  
//     setLoading(true); // Start loading
//     try {
//       // Fetch users from the selected device
//       const response = await ipcRenderer.invoke('fetch-users-from-device', selectedDevice);
      
//       if (response && Array.isArray(response.data)) {
//         // Fetch employees from the API
//         const apiResponse = await axios.get('https://swatcollegiate.edu.pk/api/device-users', {
//           params: {
//             type: selectedDevice.type,
//             token: selectedDevice.token,
//           },
//         });        const apiData = apiResponse.data;
//         console.log(response.data);
      


//    // Map through API data and match with the device user list
// const updatedUserList = apiData.map(apiUser => {
//   // Find the user in the device response by user ID
//   const matchedDeviceUser = response.data.find(deviceUser => deviceUser.userId === apiUser.userId);
  
//   if (matchedDeviceUser) {
//     console.log('Match found for user:', matchedDeviceUser.userId);
//     // Return a new object with synced user data
//     return {
//       cardno: matchedDeviceUser.cardno,
//       userId: matchedDeviceUser.userId,
//       name: matchedDeviceUser.name,
//       password: matchedDeviceUser.password,
//       role: matchedDeviceUser.role,
//       uid: matchedDeviceUser.uid,
//       status: 'sync',
//       employee_status: apiUser.status
//     };
//   } else {
//     console.log('No match found for user:', apiUser.userId);
//     // Handle non-synced users only if their `status` is 'active'
//     if (apiUser.status === 'active') {
//       return {
//         cardno: 0,
//         userId: apiUser.userId,
//         name: apiUser.name,
//         password: '',
//         role: 0,
//         uid: 0,
//         status: 'not_sync',
//         employee_status: apiUser.status
//       };
//     }
//   }

//   // Return undefined for users that don't match and aren't 'active'
//   return undefined;
// });

// // Filter out undefined values (in case of inactive users)
// const filteredUserList = updatedUserList.filter(user => user !== undefined);

// console.log('Filtered User List:', filteredUserList);

       
  
//        setUserList(filteredUserList); // Set the updated user data array
//       } else {
//         console.error('Unexpected data structure:', response);
//         setUserList([]); // Clear the table if the data structure is invalid
//       }
//     } catch (error) {
//       console.error('Failed to fetch users:', error.message);
//       alert(`Failed to fetch users: ${error.message}`);
//     } finally {
//       setLoading(false); // Stop loading
//     }
//   };

//   // Handle device selection change
//   const handleDeviceChange = (e) => {
//     const selectedDeviceId = e.target.value;
//     const device = devices.find(d => d.id.toString() === selectedDeviceId);
//     setSelectedDevice(device || null);
//     setUserList([]); // Clear user list when changing devices
//   };

// // Handle syncing a single user to the device
// const handleSync = async (user) => {
//   if (!selectedDevice) {
//     alert('No device selected!');
//     return;
//   }

//   setLoading(true); // Start loading
//   try {
//     // Add the user to the device
//     await ipcRenderer.invoke('add-user-to-device', { device: selectedDevice, user });

//     // Refresh the user list to update the status
//     await fetchUsersFromDevice();
//     alert('User synced successfully!');
//   } catch (error) {
//     console.error('Failed to sync user:', error.message);
//     alert(`Failed to sync user: ${error.message}`);
//   } finally {
//     setLoading(false); // Stop loading
//   }
// };
//   // Handle editing a user
//   const handleEdit = (user) => {
//     setEditUser({ ...user }); // Clone user object for editing
//     setIsEditModalOpen(true); // Open the edit modal
//   };

//   // Save edited user
//   const handleEditSave = async () => {
//     try {
//       await ipcRenderer.invoke('update-user-on-device', { device: selectedDevice, user: editUser });
//       fetchUsersFromDevice(); // Refresh the user list
//       alert('User updated successfully!');
//     } catch (error) {
//       console.error('Failed to update user:', error.message);
//       alert(`Failed to update user: ${error.message}`);
//     } finally {
//       setIsEditModalOpen(false); // Close the modal
//     }
//   };

//   // Handle deleting a user
//   const handleDelete = async (user) => {
//     if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
//       try {
//         await ipcRenderer.invoke('delete-user-from-device', { device: selectedDevice, uid: user.uid });
//         fetchUsersFromDevice(); // Refresh the user list
//         alert('User deleted successfully!');
//       } catch (error) {
//         console.error('Failed to delete user:', error.message);
//         alert(`Failed to delete user: ${error.message}`);
//       }
//     }
//   };

//   // Handle adding a new user
//   const handleAddUser = async () => {
//     if (!selectedDevice) return;

//     try {
//       await ipcRenderer.invoke('add-user-to-device', { device: selectedDevice, user: newUser });
//       fetchUsersFromDevice(); // Refresh the user list
//       alert('User added successfully!');
//       setIsAddModalOpen(false); // Close the modal
//       // Reset the newUser state to its initial values
//       setNewUser({ name: '', userId: '', cardno: '', role: 0, uid: '' });
//     } catch (error) {
//       console.error('Failed to add user:', error.message);
//       alert(`Failed to add user: ${error.message}`);
//     }
//   };
// // Sync users from API to the selected device
// const SyncUsersToDevice = async () => {
//   if (!selectedDevice) return;

//   setLoading(true); // Start loading
//   try {

//     // Filter users with status 'not_sync'
//     const usersToSync = userList.filter(user => user.status === 'not_sync');

//     if (usersToSync.length === 0) {
//       alert('No users to sync!');
//       return;
//     }
// // userList.filter(user .uuid  hisst value')
//     // Add each user to the device
//     for (const user of usersToSync) {
//       await ipcRenderer.invoke('add-user-to-device', { device: selectedDevice, user });
//     }

//     // Refresh the user list after syncing
//     await fetchUsersFromDevice();
//     alert('Users synced successfully!');
//   } catch (error) {
//     console.error('Failed to sync users:', error.message);
//     alert(`Failed to sync users: ${error.message}`);
//   } finally {
//     setLoading(false); // Stop loading
//   }
// };

// // Delete non-active users from the selected device
// const DeleteNonUsersToDevice = async () => {
//   if (!selectedDevice) return;

//   setLoading(true); // Start loading
//   try {
//     // Filter users with employee_status not 'active'
//     const usersToDelete = userList.filter(user => user.employee_status !== 'active');

//     if (usersToDelete.length === 0) {
//       alert('No non-active users to delete!');
//       return;
//     }

//     // Delete each user from the device
//     for (const user of usersToDelete) {
//       await ipcRenderer.invoke('delete-user-from-device', { device: selectedDevice, uid: user.uid });
//     }

//     // Refresh the user list after deletion
//     await fetchUsersFromDevice();
//     alert('Non-active users deleted successfully!');
//   } catch (error) {
//     console.error('Failed to delete non-active users:', error.message);
//     alert(`Failed to delete non-active users: ${error.message}`);
//   } finally {
//     setLoading(false); // Stop loading
//   }
// };
//   return (
//     <React.Fragment>
//       <Row>
//         <Col sm="12">
//           <Button onClick={props.goBackButton} className="primary">BACK</Button>
//           <Card body>
//             <CardTitle tag="h5">View Enrolled Students</CardTitle>
//             <CardText>View the students who are enrolled in the system</CardText>
//           </Card>
//         </Col>
//       </Row>

//       <Row>
//         <Col sm="12">
//           <FormGroup>
//             <Label for="deviceSelect">Select Device</Label>
//             <Input
//               type="select"
//               name="deviceSelect"
//               id="deviceSelect"
//               value={selectedDevice ? selectedDevice.id : ''}
//               onChange={handleDeviceChange}
//             >
//               <option value="">Select a device</option>
//               {devices.map(device => (
//                 <option key={device.id} value={device.id}>
//                   {device.name || device.ip}
//                 </option>
//               ))}
//             </Input>
//           </FormGroup>

//           <Button color="primary" onClick={fetchUsersFromDevice} disabled={!selectedDevice || loading}>
//             {loading ? <Spinner size="sm" /> : 'Fetch Users'}
//           </Button>
//           <Button color="primary" onClick={SyncUsersToDevice} disabled={!selectedDevice || loading}>
//             {loading ? <Spinner size="sm" /> : 'Sync Users'}
//           </Button>
//           <Button color="primary" onClick={DeleteNonUsersToDevice} disabled={!selectedDevice || loading}>
//             {loading ? <Spinner size="sm" /> : 'Delete None Active  Users'}
//           </Button>
//           <Button color="success" onClick={() => setIsAddModalOpen(true)} disabled={!selectedDevice}>
//             Add User
//           </Button>
//         </Col>
//       </Row>

//       <Row>
//         <Col sm="12">
//           <DataTable
//             title="User List"
//             columns={columns}
//             data={userList}
//             responsive
//             highlightOnHover
//           />
//         </Col>
//       </Row>

//       {/* Edit User Modal */}
//       <Modal isOpen={isEditModalOpen} toggle={() => setIsEditModalOpen(!isEditModalOpen)}>
//         <ModalHeader toggle={() => setIsEditModalOpen(!isEditModalOpen)}>Edit User</ModalHeader>
//         <ModalBody>
//           <FormGroup>
//             <Label for="editName">Name</Label>
//             <Input
//               id="editName"
//               value={editUser?.name || ''}
//               onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
//             />
//           </FormGroup>
//           <FormGroup>
//             <Label for="editUserID">User ID</Label>
//             <Input
//               id="editUserID"
//               value={editUser?.userId || ''}
//               onChange={(e) => setEditUser({ ...editUser, userId: e.target.value })}
//             />
//           </FormGroup>
//           <FormGroup>
//             <Label for="editRole">Role</Label>
//             <Input
//               id="editRole"
//               type="select"
//               value={editUser?.role || ''}
//               onChange={(e) => setEditUser({ ...editUser, role: parseInt(e.target.value) })}
//             >
//               <option value={0}>User</option>
//               <option value={1}>Admin</option>
//             </Input>
//           </FormGroup>
//         </ModalBody>
//         <ModalFooter>
//           <Button color="primary" onClick={handleEditSave}>Save</Button>
//           <Button color="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
//         </ModalFooter>
//       </Modal>

//       {/* Add User Modal */}
//       <Modal isOpen={isAddModalOpen} toggle={() => setIsAddModalOpen(!isAddModalOpen)}>
//         <ModalHeader toggle={() => setIsAddModalOpen(!isAddModalOpen)}>Add User</ModalHeader>
//         <ModalBody>
//           <FormGroup>
//             <Label for="addUID">UID</Label>
//             <Input
//               id="addUID"
//               value={newUser.uid}
//               onChange={(e) => setNewUser({ ...newUser, uid: e.target.value })}
//             />
//           </FormGroup>
//           <FormGroup>
//             <Label for="addName">Name</Label>
//             <Input
//               id="addName"
//               value={newUser.name}
//               onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
//             />
//           </FormGroup>
//           <FormGroup>
//             <Label for="addUserID">User ID</Label>
//             <Input
//               id="addUserID"
//               value={newUser.userId}
//               onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
//             />
//           </FormGroup>
//           <FormGroup>
//             <Label for="addRole">Role</Label>
//             <Input
//               id="addRole"
//               type="select"
//               value={newUser.role}
//               onChange={(e) => setNewUser({ ...newUser, role: parseInt(e.target.value) })}
//             >
//               <option value={0}>User</option>
//               <option value={1}>Admin</option>
//             </Input>
//           </FormGroup>
//         </ModalBody>
//         <ModalFooter>
//           <Button color="primary" onClick={handleAddUser}>Add</Button>
//           <Button color="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
//         </ModalFooter>
//       </Modal>
//     </React.Fragment>
//   );
// };

// export default User;



import React, { useState, useEffect } from 'react';
import {
  Card, CardTitle, CardText, Col, Row, Button, Input, FormGroup, Label, Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from 'reactstrap';
import DataTable from 'react-data-table-component';
const { ipcRenderer } = window.require('electron');
const axios = require('axios');

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
  const [progress, setProgress] = useState(0); // Progress state

  const columns = [
    { name: 'Card Number', selector: row => row.cardno, sortable: true },
    { name: 'Name', selector: row => row.name, sortable: true },
    { name: 'User ID', selector: row => row.userId, sortable: true },
    {
      name: 'Role',
      selector: row => row.role,
      sortable: true,
      cell: row => (row.role === 0 ? 'User' : 'Admin'),
    },
    { name: 'UID', selector: row => row.uid, sortable: true },
    { name: 'Employee Status', selector: row => row.employee_status, sortable: true },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span style={{ color: row.status === 'not_sync' ? 'red' : 'green' }}>
          {row.status === 'not_sync' ? 'Not Synced' : 'Synced'}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: row => (
        <div>
          {row.status === 'sync' ? (
            <>
              <Button size="sm" color="warning" onClick={() => handleEdit(row)}>
                Edit
              </Button>{' '}
              <Button size="sm" color="danger" onClick={() => handleDelete(row)}>
                Delete
              </Button>
            </>
          ) : (
            <Button size="sm" color="primary" onClick={() => handleSync(row)}>
              Sync
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

        const updatedUserList = apiData.map(apiUser => {
          const matchedDeviceUser = response.data.find(deviceUser => deviceUser.userId === apiUser.userId);

          if (matchedDeviceUser) {
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
          } else if (apiUser.status === 'active') {
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
          return undefined;
        });

        setUserList(updatedUserList.filter(user => user !== undefined));
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
      const usersToDelete = userList.filter(user => user.employee_status !== 'active');

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

  return (
    <React.Fragment>
      {/* Device Selection */}
      <Row>
        <Col sm="12">
          <Card body>
                        <Button onClick={props.goBackButton} color="primary">
                                  BACK
                                </Button>{" "}
            
            <CardTitle tag="h5">Device Selection</CardTitle>
            <CardText>
              Select a device to manage users.
            </CardText>
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
            Fetch Users
          </Button>
        </Col>
        <Col sm="6">
          <Button color="success" block onClick={SyncUsersToDevice} disabled={!selectedDevice || loading}>
            Sync Users to Device
          </Button>
        </Col>
      </Row>
      <Row style={{ marginTop: '20px' }}>
        <Col sm="6">
          <Button color="danger" block onClick={DeleteNonUsersToDevice} disabled={!selectedDevice || loading}>
            Delete Non-Active Users
          </Button>
        </Col>
        <Col sm="6">
          <Button color="info" block onClick={() => setIsAddModalOpen(true)} disabled={!selectedDevice || loading}>
            Add User
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
          <DataTable
            title="User List"
            columns={columns}
            data={userList}
            pagination
          />
        </Col>
      </Row>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} toggle={() => setIsAddModalOpen(!isAddModalOpen)}>
        <ModalHeader toggle={() => setIsAddModalOpen(!isAddModalOpen)}>Add User</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="name">Name</Label>
            <Input
              id="name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="userId">User ID</Label>
            <Input
              id="userId"
              value={newUser.userId}
              onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="cardno">Card Number</Label>
            <Input
              id="cardno"
              value={newUser.cardno}
              onChange={(e) => setNewUser({ ...newUser, cardno: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="role">Role</Label>
            <Input
              id="role"
              type="select"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: parseInt(e.target.value) })}
            >
              <option value="0">User</option>
              <option value="1">Admin</option>
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleAddUser}>Add</Button>{' '}
          <Button color="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

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
            <Label for="editUserId">User ID</Label>
            <Input
              id="editUserId"
              value={editUser?.userId || ''}
              onChange={(e) => setEditUser({ ...editUser, userId: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="editCardno">Card Number</Label>
            <Input
              id="editCardno"
              value={editUser?.cardno || ''}
              onChange={(e) => setEditUser({ ...editUser, cardno: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="editRole">Role</Label>
            <Input
              id="editRole"
              type="select"
              value={editUser?.role || 0}
              onChange={(e) => setEditUser({ ...editUser, role: parseInt(e.target.value) })}
            >
              <option value="0">User</option>
              <option value="1">Admin</option>
            </Input>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleEditSave}>Save</Button>{' '}
          <Button color="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default User;
