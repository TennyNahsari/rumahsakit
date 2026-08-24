import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

// Patient Module Screens
import { PatientListScreen } from '../screens/patients/PatientListScreen';
import { PatientDetailScreen } from '../screens/patients/PatientDetailScreen';
import { PatientFormScreen } from '../screens/patients/PatientFormScreen';

// Visit Module Screens
import { VisitListScreen } from '../screens/visits/VisitListScreen';
import { VisitDetailScreen } from '../screens/visits/VisitDetailScreen';
import { VisitFormScreen } from '../screens/visits/VisitFormScreen';

// Polyclinic Module Screens
import { PolyclinicListScreen } from '../screens/polyclinics/PolyclinicListScreen';
import { PolyclinicDetailScreen } from '../screens/polyclinics/PolyclinicDetailScreen';
import { PolyclinicFormScreen } from '../screens/polyclinics/PolyclinicFormScreen';

// Medical Record (EMR) Module Screens
import { RecordListScreen } from '../screens/records/RecordListScreen';
import { RecordDetailScreen } from '../screens/records/RecordDetailScreen';
import { RecordFormScreen } from '../screens/records/RecordFormScreen';

// Medicines & Pharmacy Module Screens
import { MedicineListScreen } from '../screens/medicines/MedicineListScreen';
import { MedicineDetailScreen } from '../screens/medicines/MedicineDetailScreen';
import { MedicineFormScreen } from '../screens/medicines/MedicineFormScreen';

// Rooms & Facilities Module Screens
import { RoomListScreen } from '../screens/rooms/RoomListScreen';
import { RoomDetailScreen } from '../screens/rooms/RoomDetailScreen';
import { RoomFormScreen } from '../screens/rooms/RoomFormScreen';

// Inpatient (Rawat Inap) Module Screens
import { InpatientListScreen } from '../screens/inpatients/InpatientListScreen';
import { InpatientDetailScreen } from '../screens/inpatients/InpatientDetailScreen';
import { InpatientCheckInScreen } from '../screens/inpatients/InpatientCheckInScreen';

// Billing & Cashier Module Screens
import { BillingListScreen } from '../screens/billings/BillingListScreen';
import { BillingDetailScreen } from '../screens/billings/BillingDetailScreen';
import { BillingFormScreen } from '../screens/billings/BillingFormScreen';

// User Management Module Screens
import { UserListScreen } from '../screens/users/UserListScreen';
import { UserDetailScreen } from '../screens/users/UserDetailScreen';
import { UserFormScreen } from '../screens/users/UserFormScreen';

// Reports & Analytics Module Screen
import { ReportScreen } from '../screens/reports/ReportScreen';

// Settings & Configuration Module Screen
import { SettingScreen } from '../screens/settings/SettingScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />

      {/* Patient Module Stack */}
      <Stack.Screen name="Patients" component={PatientListScreen} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
      <Stack.Screen name="PatientForm" component={PatientFormScreen} />

      {/* Visit Module Stack */}
      <Stack.Screen name="Visits" component={VisitListScreen} />
      <Stack.Screen name="VisitDetail" component={VisitDetailScreen} />
      <Stack.Screen name="VisitForm" component={VisitFormScreen} />

      {/* Polyclinic Module Stack */}
      <Stack.Screen name="Polyclinics" component={PolyclinicListScreen} />
      <Stack.Screen name="PolyclinicDetail" component={PolyclinicDetailScreen} />
      <Stack.Screen name="PolyclinicForm" component={PolyclinicFormScreen} />

      {/* Medical Record Module Stack */}
      <Stack.Screen name="Records" component={RecordListScreen} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <Stack.Screen name="RecordForm" component={RecordFormScreen} />

      {/* Medicines Module Stack */}
      <Stack.Screen name="Medicines" component={MedicineListScreen} />
      <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
      <Stack.Screen name="MedicineForm" component={MedicineFormScreen} />

      {/* Rooms Module Stack */}
      <Stack.Screen name="Rooms" component={RoomListScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen name="RoomForm" component={RoomFormScreen} />

      {/* Inpatient Module Stack */}
      <Stack.Screen name="Inpatients" component={InpatientListScreen} />
      <Stack.Screen name="InpatientDetail" component={InpatientDetailScreen} />
      <Stack.Screen name="InpatientCheckIn" component={InpatientCheckInScreen} />

      {/* Billing Module Stack */}
      <Stack.Screen name="Billings" component={BillingListScreen} />
      <Stack.Screen name="BillingDetail" component={BillingDetailScreen} />
      <Stack.Screen name="BillingForm" component={BillingFormScreen} />

      {/* User Module Stack */}
      <Stack.Screen name="Users" component={UserListScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="UserForm" component={UserFormScreen} />

      {/* Reports Module Stack */}
      <Stack.Screen name="Reports" component={ReportScreen} />

      {/* Settings Module Stack */}
      <Stack.Screen name="Settings" component={SettingScreen} />
    </Stack.Navigator>
  );
};
