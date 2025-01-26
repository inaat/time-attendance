import React, { Component } from "react";
import MenuButton from "./MenuButton";
import Attendance from "../components/Attendance";
import Device from "../components/Device";
import Persons from "../components/Persons";
import User from "../components/User";
import RealtimeAttendance from "../components/RealtimeAttendance";

const { ipcRenderer } = window.require('electron');

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
          
            screen: 'Home',
            deviceData: [], // Add device data state
        };

        this.goBackButton = this.goBackButton.bind(this);
        this.getAllDevice = this.getAllDevice.bind(this);
        this.getAllAttendance = this.getAllAttendance.bind(this);
        this.getUsers = this.getUsers.bind(this);
        this.getRealTimeAttendance = this.getRealTimeAttendance.bind(this);
    }

// In renderer process
getAllDevice() {
            this.updateScreenState('device');

}
// In renderer process
getAllAttendance() {
this.updateScreenState('attendance');

}
// In renderer process
getUsers() {
this.updateScreenState('user');

}
// In renderer process
getRealTimeAttendance() {
this.updateScreenState('real-time-attendance');

}

    


    goBackButton() {
        this.updateScreenState('Home');
    }

    updateScreenState(screen) {
        this.setState({
            screen: screen,
        });
    }

    render() {
        const { screen } = this.state;

        if (screen === 'Home') {
            return (
                <MenuButton
                    getAllAttendance={this.getAllAttendance}
                    getAllDevice={this.getAllDevice} // Add getAllDevice handler
                    getUsers={this.getUsers} // Add getAllDevice handler
                    getRealTimeAttendance={this.getRealTimeAttendance} // Add getAllDevice handler
                />
            );
        } else if (screen === 'attendance') {
            return (
                <Attendance
                    
                    goBackButton={this.goBackButton}
                />
            );
        
        } else if (screen === 'device') {
            return (
                <Device
               // Pass device data to the Device component
                    goBackButton={this.goBackButton}
                />
            );
        }else if (screen === 'user') {
            return (
                <User
               // Pass device data to the Device component
                    goBackButton={this.goBackButton}
                />
            );
        }
        else if (screen === 'real-time-attendance') {
            return (
                <RealtimeAttendance
               // Pass device data to the Device component
                    goBackButton={this.goBackButton}
                />
            );
        }
        
        else {
            return <h4>Loading...</h4>;
        }
    }
}

export default Home;
