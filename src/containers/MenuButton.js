import React from "react";
import {
    Card, CardBody, CardTitle, CardText, ListGroup,
    ListGroupItem, CardLink, Button, Col, Row
} from "reactstrap";

const MenuButton = (props) => {
    return (
        <React.Fragment>
             <Row>
                <Col sm="6">
                    <Card body>
                        <CardTitle tag="h5">View Device</CardTitle>
                        <CardText>
                            View the 
                        </CardText>
                        <Button onClick={props.getAllDevice}>
                            VIEW Devices
                        </Button>
                    </Card>
                </Col>
             
            
                <Col sm="6">
                    <Card body>
                        <CardTitle tag="h5">Enroll Users</CardTitle>
                        <CardText>
                            Register the Users who are enrolled in attendance machine
                        </CardText>
                        <Button onClick={props.getUsers}>
                            ENROLL NOW
                        </Button>
                    </Card>
                </Col>
                
            </Row>
            <Row>
               
                <Col sm="6">
                    <Card body>
                        <CardTitle tag="h5">
                            View Attendance
                        </CardTitle>
                        <CardText>
                            View  the attendance data from the attendance machine
                        </CardText>
                        <Button onClick={props.getAllAttendance}>
                            VIEW NOW
                        </Button>
                    </Card>
                </Col>
                <Col sm="6">
                    <Card body>
                        <CardTitle tag="h5">
                            Real Time Attendance
                        </CardTitle>
                        <CardText>
                        View real-time attendance logs from multiple devices
                        </CardText>
                        <Button onClick={props.getRealTimeAttendance}>
                            VIEW NOW
                        </Button>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default MenuButton