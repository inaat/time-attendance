import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardTitle,
  CardText,
  Col,
  Row,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import DataTable from "react-data-table-component";

const { ipcRenderer } = window.require('electron');

const columns = (handleEdit, handleDelete, testConnection, t) => [
  {
    name: t('devices.columns.id'),
    selector: (row) => row.id,
    sortable: true,
  },
  {
    name: t('devices.columns.ip'),
    selector: (row) => row.ip,
    sortable: true,
  },
  {
    name: t('devices.columns.type'),
    selector: (row) => row.type,
    sortable: true,
  },
  {
    name: t('devices.columns.url'),
    selector: (row) => row.url,
    sortable: true,
    cell: (row) => (
      <a href={row.url} target="_blank" rel="noopener noreferrer">
        {row.url}
      </a>
    ),
  },
  {
    name: t('devices.columns.getUserUrl'),
    selector: (row) => row.get_user_url,
    sortable: true,
    cell: (row) => (
      <a href={row.get_user_url} target="_blank" rel="noopener noreferrer">
        {row.get_user_url}
      </a>
    ),
  },
  {
    name: t('devices.columns.token'),
    selector: (row) => row.token,
    sortable: true,
  },
  {
    name: t('devices.columns.actions'),
    cell: (row) => (
      <div>
        <Button color="info" size="sm" onClick={() => handleEdit(row)}>
          {t('devices.actions.edit')}
        </Button>{" "}
        <Button color="danger" size="sm" onClick={() => handleDelete(row)}>
          {t('devices.actions.delete')}
        </Button>{" "}
        <Button color="success" size="sm" onClick={() => testConnection(row)}>
          {t('devices.actions.test')}
        </Button>
      </div>
    ),
  },
];

const Device = (props) => {
  const { t } = useTranslation();
  const [data, setDevices] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalType, setModalType] = useState("Add");
  const [formData, setFormData] = useState({
    id: "",
    ip: "",
    url: "",
    get_user_url: "",
    type: "student",
    token: ""
  });
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  // Fix focus when modal opens
  useEffect(() => {
    const fixFocus = async () => {
      if (modal) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait for modal to render
          await ipcRenderer.invoke('window-refocus');
        } catch (error) {
          console.error('Focus fix failed:', error);
        }
      }
    };
    fixFocus();
  }, [modal]);

  const fetchDevices = () => {
    ipcRenderer.invoke('fetch-all-devices')
      .then(data => {
        setDevices(data);
      })
      .catch(error => {
        console.error('Failed to fetch devices:', error);
        alert('Failed to load devices. Please try again.');
      });
  };

  const testConnection = async (row) => {
    try {
      const result = await ipcRenderer.invoke('test-device-connection', row);
      if (result.success) {
        alert(`✅ Connection successful to ${row.url}`);
      } else {
        alert(`❌ Connection failed to ${row.url}: ${result.error}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert(`🚨 Error testing connection to ${row.url}`);
    }
  };

  const toggleModal = () => setModal(!modal);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAdd = () => {
    setModalType("Add");
    setFormData({ id: "", ip: "", url: "", get_user_url: "", type: "student", token: "" });
    toggleModal();
  };

  const handleEdit = (row) => {
    setModalType("Edit");
    setFormData(row);
    setSelectedRow(row);
    toggleModal();
  };

  const handleDelete = async (row) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete device ${row.id} (${row.url})?`
    );
    if (confirmDelete) {
      try {
        await ipcRenderer.invoke('delete-device', row.id);
        fetchDevices();
        alert(`Device ${row.id} deleted successfully`);
      } catch (error) {
        console.error('Failed to delete device:', error);
        alert(`Failed to delete device: ${error.message}`);
      }
    }
  };

  const validateForm = () => {
    if (!formData.id || !formData.ip || !formData.url || !formData.get_user_url) {
      alert('Please fill in all required fields');
      return false;
    }
    
    try {
      new URL(formData.url);
      new URL(formData.get_user_url);
    } catch (error) {
      alert('Please enter valid URLs (e.g., http://example.com)');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalType === "Add") {
        await ipcRenderer.invoke('add-device', formData);
        alert('Device added successfully');
      } else if (modalType === "Edit") {
        await ipcRenderer.invoke('edit-device', { 
          id: formData.id, 
          updatedDevice: formData 
        });
        alert('Device updated successfully');
      }
      toggleModal();
      fetchDevices();
    } catch (error) {
      console.error('Failed to save device:', error);
      alert(`Error saving device: ${error.message}`);
    }
  };

  return (
    <React.Fragment>
      <Row className="mb-3">
        <Col sm="12">
          <Button onClick={props.goBackButton} color="primary" size="sm">
            {t('common.back')}
          </Button>{" "}
          <Button onClick={handleAdd} color="success">
            {t('devices.addDevice')}
          </Button>
          <Card body className="mt-3">
            <CardTitle tag="h5">{t('devices.title')}</CardTitle>
            <CardText>
              {t('devices.subtitle')}
              <br />
              {t('devices.totalDevices')}: {data.length}
            </CardText>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col sm="12">
          <DataTable
            title={t('devices.title')}
            columns={columns(handleEdit, handleDelete, testConnection, t)}
            data={data}
            responsive
            pagination
            highlightOnHover
            noDataComponent={t('common.noData')}
            paginationComponentOptions={{
              rowsPerPageText: t('common.rowsPerPage'),
              rangeSeparatorText: t('common.of'),
            }}
          />
        </Col>
      </Row>

      <Modal isOpen={modal} toggle={toggleModal} size="lg">
        <ModalHeader toggle={toggleModal}>
          {modalType === "Add" ? t('devices.modal.addTitle') : t('devices.modal.editTitle')}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="id">{t('devices.modal.deviceId')} *</Label>
              <Input
                type="text"
                name="id"
                id="id"
                value={formData.id}
                onChange={handleInputChange}
                disabled={modalType === "Edit"}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="ip">{t('devices.modal.ipAddress')} *</Label>
              <Input
                type="text"
                name="ip"
                id="ip"
                value={formData.ip}
                onChange={handleInputChange}
                required
                pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                title="Enter a valid IPv4 address"
              />
            </FormGroup>
            <FormGroup>
              <Label for="url">{t('devices.modal.endpointUrl')} *</Label>
              <Input
                type="url"
                name="url"
                id="url"
                value={formData.url}
                onChange={handleInputChange}
                pattern="https?://.*"
                placeholder="http://example.com/api"
                required
              />
              <small className="form-text text-muted">
                {t('devices.modal.urlHelper')}
              </small>
            </FormGroup>
            <FormGroup>
              <Label for="get_user_url">{t('devices.modal.getUserUrl')} *</Label>
              <Input
                type="url"
                name="get_user_url"
                id="get_user_url"
                value={formData.get_user_url}
                onChange={handleInputChange}
                pattern="https?://.*"
                placeholder="http://example.com/api/user"
                required
              />
              <small className="form-text text-muted">
                {t('devices.modal.urlHelper')}
              </small>
            </FormGroup>
            <FormGroup>
              <Label for="token">{t('devices.modal.token')}</Label>
              <Input
                type="text"
                name="token"
                id="token"
                value={formData.token}
                onChange={handleInputChange}
              />
            </FormGroup>
            <FormGroup>
              <Label for="type">{t('devices.modal.deviceType')}</Label>
              <Input
                type="select"
                name="type"
                id="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="student">{t('devices.modal.types.student')}</option>
                <option value="staff">{t('devices.modal.types.staff')}</option>
                <option value="admin">{t('devices.modal.types.admin')}</option>
              </Input>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleSave}>
            {modalType === "Add" ? t('devices.modal.create') : t('devices.modal.saveChanges')}
          </Button>{" "}
          <Button color="secondary" onClick={toggleModal}>
            {t('devices.modal.cancel')}
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default Device;